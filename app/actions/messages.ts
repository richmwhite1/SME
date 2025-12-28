"use server";

import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
  sender_name?: string;
  sender_avatar?: string;
};

export type Conversation = {
  other_user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  last_message: {
    content: string;
    created_at: Date;
    is_read: boolean;
    sender_id: string;
  };
};

export async function sendMessage(recipientId: string, content: string, honeypot?: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  if (!content.trim()) throw new Error("Message cannot be empty");

  // 0. BOT TRAP (Honeypot)
  if (honeypot) {
    console.warn(`[BOT TRAP] User ${user.id} filled honeypot. Blocking.`);
    // We could ban them immediately here, but for now let's just block the request
    // and maybe return success to confuse them? Or throw error.
    // Let's throw error for now so UI shows something (or nothing)
    throw new Error("Message failed to send.");
  }

  const sql = getDb();

  // 1. CHECK IF BANNED
  const [senderProfile] = await sql`
        SELECT messaging_banned, messaging_disabled_until, reputation_score, is_sme, created_at
        FROM profiles 
        WHERE id = ${user.id}
    `;

  if (senderProfile?.messaging_banned) {
    throw new Error("Your messaging privileges have been suspended due to spam reports.");
  }

  // Check temporary timeout if we had that logic (using messaging_disabled_until)
  if (senderProfile?.messaging_disabled_until && new Date(senderProfile.messaging_disabled_until) > new Date()) {
    throw new Error("Your messaging privileges are temporarily suspended.");
  }

  // 2. RATE LIMITING (Sliding Window)
  // Rule: New users (Rep < 10) max 3 NEW conversations per hour.
  // Existing conversations are usually fine, but let's limit "New Conversations" specifically? 
  // The requirement says "3 new conversations per hour".
  // Let's implement a general rate limit first: Max 30 messages/hour for low rep to be safe?
  // Requirement text: "Restrict new users (Reputation < 10) to a maximum of 3 new conversations per hour."

  // Let's verify "New Conversation" -> Has user sent message to this recipient before?
  const [existingConv] = await sql`
        SELECT 1 FROM messages 
        WHERE sender_id = ${user.id} AND recipient_id = ${recipientId} 
        LIMIT 1
    `;

  const isNewConversation = !existingConv;
  const isLowRep = (senderProfile?.reputation_score || 0) < 10 && !senderProfile?.is_sme;

  if (isNewConversation && isLowRep) {
    // Count new conversations in last hour
    // This is a bit heavy query, but accurate. 
    // Find distinct recipients messaged in last hour who were NOT messaged before last hour.
    // Simplification: Count distinct recipients in last hour. If > 3, block. 
    // (This is stricter than "new" conversations, but safer).

    const [recentConversations] = await sql`
            SELECT count(DISTINCT recipient_id) as count
            FROM messages
            WHERE sender_id = ${user.id}
            AND created_at > NOW() - INTERVAL '1 hour'
        `;

    if (parseInt(recentConversations.count) >= 3) {
      throw new Error("Rate limit exceeded. You can only start 3 new conversations per hour as a new user.");
    }
  }

  // 3. COPY-PASTE DETECTION
  // "Same message to 5 different people within 2 minutes"
  const [duplicateCount] = await sql`
        SELECT count(*) as count
        FROM messages 
        WHERE sender_id = ${user.id}
        AND created_at > NOW() - INTERVAL '2 minutes'
        AND content = ${content}
    `;

  if (parseInt(duplicateCount.count) >= 5) {
    // Trigger "Account Under Review" / Pause
    // For now, just block the message
    throw new Error("Message blocked. Automated behavior detected.");
  }

  // 4. VERIFIED-ONLY FILTER (Recipient Preference)
  const [recipientProfile] = await sql`
        SELECT allows_guest_messages FROM profiles WHERE id = ${recipientId}
    `;

  // If recipient only allows Verified/SME messages (we can reuse allows_guest_messages as the toggle)
  // Implementation Plan called it "Verified-Only Filter". 
  // Let's assume allows_guest_messages = false means "Only Verified/SME/Connections".
  // For now, simple check:
  if (recipientProfile && recipientProfile.allows_guest_messages === false) {
    if (!senderProfile?.is_sme && (senderProfile?.reputation_score || 0) < 50) {
      throw new Error("This user only accepts messages from verified experts or connections.");
    }
  }

  await sql`
    INSERT INTO messages (sender_id, recipient_id, content)
    VALUES (${user.id}, ${recipientId}, ${content})
  `;

  revalidatePath("/messages");
  return { success: true };
}

export async function getConversations() {
  const user = await currentUser();
  if (!user) return [];

  const sql = getDb();

  // This query gets the latest message for every conversation pair involving the current user.
  // It's a bit complex: find all unique pairs, get max date, join.

  // Strategy:
  // 1. Get all distinct other users
  // 2. For each, get latest message
  // 3. Join profile info

  // Optimized query finding latest message per conversation
  const conversations = await sql`
    WITH distinct_chats AS (
      SELECT 
        CASE WHEN sender_id = ${user.id} THEN recipient_id ELSE sender_id END as other_user_id,
        MAX(created_at) as last_msg_time
      FROM messages
      WHERE sender_id = ${user.id} OR recipient_id = ${user.id}
      GROUP BY 1
    )
    SELECT 
      p.id as  other_user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      m.content,
      m.created_at,
      m.is_read,
      m.sender_id
    FROM distinct_chats dc
    JOIN profiles p ON p.id = dc.other_user_id
    JOIN messages m ON (
      (m.sender_id = ${user.id} AND m.recipient_id = dc.other_user_id) OR
      (m.sender_id = dc.other_user_id AND m.recipient_id = ${user.id})
    ) AND m.created_at = dc.last_msg_time
    ORDER BY dc.last_msg_time DESC
  `;

  return conversations.map((c: any) => ({
    other_user: {
      id: c.other_user_id,
      username: c.username,
      full_name: c.full_name,
      avatar_url: c.avatar_url
    },
    last_message: {
      content: c.content,
      created_at: new Date(c.created_at),
      is_read: c.is_read,
      sender_id: c.sender_id
    }
  })) as Conversation[];
}

export async function getMessages(otherUserId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const sql = getDb();

  const messages = await sql`
    SELECT 
      m.*,
      p.full_name as sender_name,
      p.avatar_url as sender_avatar
    FROM messages m
    JOIN profiles p ON m.sender_id = p.id
    WHERE 
      (m.sender_id = ${user.id} AND m.recipient_id = ${otherUserId}) OR
      (m.sender_id = ${otherUserId} AND m.recipient_id = ${user.id})
    ORDER BY m.created_at ASC
  `;

  // Mark as read if I am the recipient
  await sql`
    UPDATE messages 
    SET is_read = true 
    WHERE recipient_id = ${user.id} AND sender_id = ${otherUserId} AND is_read = false
  `;

  return messages.map((m: any) => ({
    ...m,
    created_at: new Date(m.created_at)
  })) as Message[];
}
