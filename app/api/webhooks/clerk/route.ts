import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { getDb } from '@/lib/db';

/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to Railway Postgres
 * Handles: user.created, user.updated events
 */
export async function POST(req: NextRequest) {
    try {
        // Get webhook secret from environment
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('⚠️ Missing CLERK_WEBHOOK_SECRET environment variable');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        // Get the headers
        const svix_id = req.headers.get('svix-id');
        const svix_timestamp = req.headers.get('svix-timestamp');
        const svix_signature = req.headers.get('svix-signature');

        // If there are no headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            console.error('⚠️ Missing svix headers');
            return NextResponse.json(
                { error: 'Missing svix headers' },
                { status: 400 }
            );
        }

        // Get the body
        const body = await req.text();

        // Create a new Svix instance with your webhook secret
        const wh = new Webhook(webhookSecret);

        let evt: any;

        // Verify the webhook signature
        try {
            evt = wh.verify(body, {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            });
        } catch (err) {
            console.error('❌ Webhook signature verification failed:', err);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // Get the event type and data
        const eventType = evt.type;
        const userData = evt.data;

        console.log(`📨 Clerk webhook received: ${eventType}`);

        // Handle user.created and user.updated events
        if (eventType === 'user.created' || eventType === 'user.updated') {
            await syncUserToDatabase(userData);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('❌ Clerk webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

/**
 * Sync user data from Clerk to the profiles table
 */
async function syncUserToDatabase(userData: any) {
    try {
        const sql = getDb();

        // Extract user data from Clerk payload
        const userId = userData.id;
        const email = userData.email_addresses?.[0]?.email_address || '';
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        const fullName = firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName || email || 'User';
        const avatarUrl = userData.image_url || null;

        // Extract brand rep status from publicMetadata
        const isBrandRep = userData.public_metadata?.isBrandRep === true;

        console.log(`🔄 Syncing user to database: ${userId} (${email})`);
        console.log(`   Brand Rep: ${isBrandRep}`);

        // UPSERT user into profiles table
        // INSERT if new, UPDATE if exists
        await sql`
      INSERT INTO profiles (
        id, 
        email, 
        full_name, 
        avatar_url, 
        is_brand_rep,
        contributor_score,
        created_at,
        updated_at
      )
      VALUES (
        ${userId},
        ${email},
        ${fullName},
        ${avatarUrl},
        ${isBrandRep},
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        is_brand_rep = EXCLUDED.is_brand_rep,
        updated_at = NOW()
    `;

        console.log(`✅ User synced successfully: ${userId}`);
    } catch (error) {
        console.error('❌ Error syncing user to database:', error);
        throw error;
    }
}
