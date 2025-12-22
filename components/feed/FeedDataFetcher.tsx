import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, BookOpen, TrendingUp, Award, ArrowRight } from "lucide-react";
import { getDb } from "@/lib/db";
import FeedContent from "./FeedContent";

// Interfaces needed for data fetching
interface ActiveThread {
    discussion_id: string;
    discussion_slug: string;
    discussion_title: string;
    last_reply_at: string;
    reply_count: number;
    author_name: string | null;
    author_username: string | null;
    tags: string[] | null;
}

interface FollowedSignalItem {
    id: string;
    type: "product" | "discussion" | "evidence";
    title: string;
    content: string;
    created_at: string;
    author_id?: string | null;
    author_name: string | null;
    author_username: string | null;
    slug: string | null;
    tags: string[] | null;
    is_sme_certified?: boolean;
}

interface TrustTrendItem {
    id: string;
    type: "product" | "discussion";
    title: string;
    content: string;
    created_at: string;
    author_id?: string | null;
    author_name: string | null;
    author_username: string | null;
    slug: string;
    tags: string[] | null;
    topic: string;
    signal_score: number;
}

interface FeedDataFetcherProps {
    followedTopics: string[];
    userId: string;
}

export default async function FeedDataFetcher({ followedTopics, userId }: FeedDataFetcherProps) {
    const sql = getDb();
    const user = { id: userId }; // Simplified user object for SQL queries

    // Get tracked SMEs (users being followed)
    let trackedSMEsResult: any[] = [];
    try {
        trackedSMEsResult = await sql`
      SELECT following_id 
      FROM follows 
      WHERE follower_id = ${user.id}
    `;
    } catch (err) {
        console.warn("Failed to fetch followed SMEs:", err);
    }
    const trackedSMEIds = trackedSMEsResult.map((f: any) => f.following_id);

    // 1. Active Threads: Discussions user commented on with new replies
    const activeThreads: ActiveThread[] = [];

    if (sql) {
        try {
            // Get discussions user has commented on
            const userCommentsResult = await sql`
        SELECT DISTINCT discussion_id 
        FROM discussion_comments 
        WHERE author_id = ${user.id} 
          AND discussion_id IS NOT NULL
      `;

            if (userCommentsResult.length > 0) {
                const discussionIds = userCommentsResult.map((c: any) => c.discussion_id);

                for (const discussionId of discussionIds) {
                    // Get user's last comment time
                    const userLastCommentResult = await sql`
            SELECT created_at 
            FROM discussion_comments 
            WHERE discussion_id = ${discussionId} 
              AND author_id = ${user.id} 
            ORDER BY created_at DESC 
            LIMIT 1
          `;

                    const userLastComment = userLastCommentResult[0];

                    if (userLastComment && userLastComment.created_at) {
                        // Get replies after user's last comment
                        const newRepliesResult = await sql`
              SELECT id, created_at 
              FROM discussion_comments 
              WHERE discussion_id = ${discussionId} 
                AND created_at > ${userLastComment.created_at} 
                AND author_id != ${user.id}
            `;

                        if (newRepliesResult.length > 0) {
                            const discussionResult = await sql`
                SELECT 
                  d.id, d.title, d.slug, d.tags, 
                  p.full_name, p.username
                FROM discussions d
                LEFT JOIN profiles p ON d.author_id = p.id
                WHERE d.id = ${discussionId}
                LIMIT 1
              `;

                            const discussion = discussionResult[0];

                            if (discussion) {
                                activeThreads.push({
                                    discussion_id: discussion.id,
                                    discussion_slug: discussion.slug,
                                    discussion_title: discussion.title,
                                    last_reply_at: newRepliesResult[0].created_at,
                                    reply_count: newRepliesResult.length,
                                    author_name: discussion.full_name || null,
                                    author_username: discussion.username || null,
                                    tags: discussion.tags,
                                });
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn("Error fetching active threads:", err);
        }
    }

    // Sort by last reply time
    activeThreads.sort(
        (a, b) => new Date(b.last_reply_at).getTime() - new Date(a.last_reply_at).getTime()
    );

    // 2. Followed Signal: New products/research in 12 Master Topics user follows
    const followedSignalItems: FollowedSignalItem[] = [];

    if (followedTopics.length > 0 && sql) {
        try {
            const masterTopicsResult = await sql`
        SELECT name 
        FROM master_topics 
        ORDER BY display_order ASC 
        LIMIT 12
      `;

            const masterTopicNames = masterTopicsResult.map((t: any) => t.name);
            const followedMasterTopics = followedTopics.filter((t) =>
                masterTopicNames.includes(t)
            );

            if (followedMasterTopics.length > 0) {
                // Fetch discussions
                const discussionsResult = await sql`
          SELECT 
            d.id, d.title, d.content, d.slug, d.tags, d.created_at,
            p.id as author_id, p.full_name, p.username
          FROM discussions d
          LEFT JOIN profiles p ON d.author_id = p.id
          WHERE d.is_flagged = false
            AND d.tags && ${sql.array(followedMasterTopics)}
          ORDER BY d.created_at DESC
          LIMIT 50
        `;

                if (discussionsResult.length > 0) {
                    discussionsResult.forEach((d: any) => {
                        followedSignalItems.push({
                            id: d.id,
                            type: "discussion",
                            title: d.title,
                            content: d.content,
                            created_at: d.created_at,
                            author_id: d.author_id,
                            author_name: d.full_name,
                            author_username: d.username,
                            slug: d.slug,
                            tags: d.tags,
                        });
                    });
                }

                // Fetch products
                try {
                    const productsResult = await sql`
            SELECT 
              id, title, problem_solved as content, slug, tags, created_at, is_sme_certified
            FROM products
            WHERE tags && ${sql.array(followedMasterTopics)}
            ORDER BY created_at DESC
            LIMIT 20
          `;

                    if (productsResult.length > 0) {
                        productsResult.forEach((p: any) => {
                            followedSignalItems.push({
                                id: p.id,
                                type: "product",
                                title: p.title,
                                content: p.content,
                                created_at: p.created_at,
                                author_id: null,
                                author_name: "Organic Intelligence",
                                author_username: null,
                                slug: p.slug,
                                tags: p.tags,
                                is_sme_certified: p.is_sme_certified,
                            });
                        });
                    }
                } catch (err) {
                    console.warn("Error fetching protocols for feed:", err);
                }
            }
        } catch (err) {
            console.warn("Error fetching followed signal items:", err);
        }
    }

    // Sort followed signal items
    followedSignalItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Tracked SME Items
    const trackedSMEItems: FollowedSignalItem[] = [];
    if (trackedSMEIds.length > 0 && sql) {
        try {
            const smeDiscussionsResult = await sql`
        SELECT 
          d.id, d.title, d.content, d.slug, d.tags, d.created_at,
          p.id as author_id, p.full_name, p.username
        FROM discussions d
        LEFT JOIN profiles p ON d.author_id = p.id
        WHERE d.author_id IN ${sql(trackedSMEIds)}
          AND d.is_flagged = false
        ORDER BY d.created_at DESC
        LIMIT 20
      `;

            smeDiscussionsResult.forEach((d: any) => {
                trackedSMEItems.push({
                    id: d.id,
                    type: "discussion",
                    title: d.title,
                    content: d.content,
                    created_at: d.created_at,
                    author_id: d.author_id,
                    author_name: d.full_name,
                    author_username: d.username,
                    slug: d.slug,
                    tags: d.tags,
                });
            });

            try {
                const smeEvidenceResult = await sql`
          SELECT 
            es.origin_id, es.title, es.reference_url, es.created_at,
            p.id as author_id, p.full_name as author_name, p.username as author_username
          FROM evidence_submissions es
          LEFT JOIN profiles p ON es.submitted_by = p.id
          WHERE es.submitted_by IN ${sql(trackedSMEIds)}
            AND es.status = 'verified'
          ORDER BY es.created_at DESC
          LIMIT 20
        `;

                smeEvidenceResult.forEach((ev: any) => {
                    trackedSMEItems.push({
                        id: ev.origin_id,
                        type: "evidence",
                        title: ev.title,
                        content: ev.reference_url || "",
                        created_at: ev.created_at,
                        author_id: ev.author_id || null,
                        author_name: ev.author_name,
                        author_username: ev.author_username,
                        slug: null,
                        tags: null,
                    });
                });
            } catch (err) {
                console.warn("Evidence submissions table might not exist:", err);
            }
        } catch (err) {
            console.warn("Error fetching tracked SME items:", err);
        }
    }

    trackedSMEItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 3. Trust Trends
    let trustTrendItem: TrustTrendItem | null = null;
    if (followedTopics.length > 0 && sql) {
        try {
            const allDiscussionsResult = await sql`
        SELECT 
          d.id, d.title, d.content, d.slug, d.tags, d.created_at,
          p.id as author_id, p.full_name, p.username, p.badge_type
        FROM discussions d
        LEFT JOIN profiles p ON d.author_id = p.id
        WHERE d.is_flagged = false
        ORDER BY d.created_at DESC
        LIMIT 100
      `;

            if (allDiscussionsResult.length > 0) {
                const unfollowedDiscussions = allDiscussionsResult.filter((d: any) => {
                    if (!d.tags || d.tags.length === 0) return false;
                    if (d.badge_type !== "Trusted Voice") return false;
                    return d.tags.every((tag: string) => !followedTopics.includes(tag));
                });

                if (unfollowedDiscussions.length > 0) {
                    const selected = unfollowedDiscussions[0];
                    const firstUnfollowedTopic = selected.tags.find(
                        (tag: string) => !followedTopics.includes(tag)
                    );

                    trustTrendItem = {
                        id: selected.id,
                        type: "discussion",
                        title: selected.title,
                        content: selected.content,
                        created_at: selected.created_at,
                        author_id: selected.author_id || null,
                        author_name: selected.full_name || null,
                        author_username: selected.username || null,
                        slug: selected.slug,
                        tags: selected.tags,
                        topic: firstUnfollowedTopic || "",
                        signal_score: 5,
                    };
                }
            }
        } catch (err) {
            console.warn("Error fetching trust trends:", err);
        }
    }

    return (
        <FeedContent
            activeThreads={activeThreads}
            followedSignalItems={followedSignalItems}
            trackedSMEItems={trackedSMEItems}
            trustTrendItem={trustTrendItem}
            followedTopics={followedTopics}
        />
    );
}
