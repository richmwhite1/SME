import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/**
 * Temporary API route to run the SME Reputation Lifecycle migration
 * DELETE THIS ROUTE AFTER MIGRATION IS COMPLETE
 */
export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();

    // NOTE: Admin check temporarily disabled for initial migration
    // After migration is complete, uncomment this section and delete this route
    /*
    const profile = await sql`
      SELECT is_admin FROM profiles WHERE id = ${user.id}
    `;

    if (!profile[0]?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    */

    // Run the migration
    const results: any = {
      steps: [],
      errors: [],
    };

    try {
      // 1. Add is_sme column
      await sql`
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS is_sme BOOLEAN DEFAULT false
      `;
      results.steps.push("✅ Added is_sme column to profiles table");

      // 2. Create index
      await sql`
        CREATE INDEX IF NOT EXISTS idx_profiles_is_sme ON profiles(is_sme) WHERE is_sme = true
      `;
      results.steps.push("✅ Created index on is_sme column");

      // 3. Create calculate_user_reputation function
      await sql`
        CREATE OR REPLACE FUNCTION calculate_user_reputation(user_id_param TEXT)
        RETURNS INTEGER AS $$
        DECLARE
          total_reputation INTEGER := 0;
          discussion_vote_count INTEGER := 0;
          discussion_comment_vote_count INTEGER := 0;
          product_comment_vote_count INTEGER := 0;
        BEGIN
          SELECT COALESCE(SUM(d.upvote_count), 0) INTO discussion_vote_count
          FROM discussions d
          WHERE d.author_id = user_id_param;
          
          SELECT COALESCE(SUM(dc.upvote_count), 0) INTO discussion_comment_vote_count
          FROM discussion_comments dc
          WHERE dc.author_id = user_id_param;
          
          SELECT COALESCE(SUM(pc.upvote_count), 0) INTO product_comment_vote_count
          FROM product_comments pc
          WHERE pc.user_id = user_id_param;
          
          total_reputation := discussion_vote_count + discussion_comment_vote_count + product_comment_vote_count;
          
          RETURN total_reputation;
        END;
        $$ LANGUAGE plpgsql
      `;
      results.steps.push("✅ Created calculate_user_reputation function");

      // 4. Create sync_sme_status trigger function
      await sql`
        CREATE OR REPLACE FUNCTION sync_sme_status()
        RETURNS TRIGGER AS $$
        DECLARE
          old_sme_status BOOLEAN;
          new_sme_status BOOLEAN;
        BEGIN
          old_sme_status := OLD.is_sme;
          new_sme_status := (NEW.reputation_score >= 100);
          
          IF new_sme_status != old_sme_status THEN
            NEW.is_sme := new_sme_status;
            
            INSERT INTO admin_logs (admin_id, action, details)
            VALUES (
              NEW.id,
              CASE 
                WHEN new_sme_status THEN 'sme_promoted'
                ELSE 'sme_demoted'
              END,
              jsonb_build_object(
                'user_id', NEW.id,
                'reputation_score', NEW.reputation_score,
                'old_status', old_sme_status,
                'new_status', new_sme_status,
                'timestamp', NOW()
              )
            );
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `;
      results.steps.push("✅ Created sync_sme_status trigger function");

      // 5. Attach trigger to profiles table
      await sql`DROP TRIGGER IF EXISTS trigger_sync_sme_status ON profiles`;
      await sql`
        CREATE TRIGGER trigger_sync_sme_status
          BEFORE UPDATE OF reputation_score ON profiles
          FOR EACH ROW
          WHEN (OLD.reputation_score IS DISTINCT FROM NEW.reputation_score)
          EXECUTE FUNCTION sync_sme_status()
      `;
      results.steps.push("✅ Created trigger_sync_sme_status on profiles table");

      // 6. Create recalculate_and_update_reputation function
      await sql`
        CREATE OR REPLACE FUNCTION recalculate_and_update_reputation(user_id_param TEXT)
        RETURNS TABLE(
          user_id TEXT,
          old_reputation INTEGER,
          new_reputation INTEGER,
          old_sme_status BOOLEAN,
          new_sme_status BOOLEAN
        ) AS $$
        DECLARE
          v_old_reputation INTEGER;
          v_new_reputation INTEGER;
          v_old_sme_status BOOLEAN;
          v_new_sme_status BOOLEAN;
        BEGIN
          SELECT reputation_score, is_sme INTO v_old_reputation, v_old_sme_status
          FROM profiles
          WHERE id = user_id_param;
          
          v_new_reputation := calculate_user_reputation(user_id_param);
          
          UPDATE profiles
          SET reputation_score = v_new_reputation
          WHERE id = user_id_param
          RETURNING is_sme INTO v_new_sme_status;
          
          RETURN QUERY SELECT 
            user_id_param,
            v_old_reputation,
            v_new_reputation,
            v_old_sme_status,
            v_new_sme_status;
        END;
        $$ LANGUAGE plpgsql
      `;
      results.steps.push("✅ Created recalculate_and_update_reputation function");

      // 7. Create update_author_reputation_on_vote trigger function
      await sql`
        CREATE OR REPLACE FUNCTION update_author_reputation_on_vote()
        RETURNS TRIGGER AS $$
        DECLARE
          author_user_id TEXT;
        BEGIN
          IF TG_TABLE_NAME = 'discussion_votes' THEN
            SELECT author_id INTO author_user_id
            FROM discussions
            WHERE id = COALESCE(NEW.discussion_id, OLD.discussion_id);
            
          ELSIF TG_TABLE_NAME = 'comment_votes' THEN
            IF COALESCE(NEW.comment_type, OLD.comment_type) = 'discussion' THEN
              SELECT author_id INTO author_user_id
              FROM discussion_comments
              WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
              
            ELSIF COALESCE(NEW.comment_type, OLD.comment_type) = 'product' THEN
              SELECT user_id INTO author_user_id
              FROM product_comments
              WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
            END IF;
          END IF;
          
          IF author_user_id IS NOT NULL THEN
            PERFORM recalculate_and_update_reputation(author_user_id);
          END IF;
          
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql
      `;
      results.steps.push("✅ Created update_author_reputation_on_vote function");

      // 8. Attach triggers to vote tables
      await sql`DROP TRIGGER IF EXISTS trigger_update_reputation_on_discussion_vote ON discussion_votes`;
      await sql`
        CREATE TRIGGER trigger_update_reputation_on_discussion_vote
          AFTER INSERT OR DELETE ON discussion_votes
          FOR EACH ROW
          EXECUTE FUNCTION update_author_reputation_on_vote()
      `;
      results.steps.push("✅ Created trigger on discussion_votes table");

      await sql`DROP TRIGGER IF EXISTS trigger_update_reputation_on_comment_vote ON comment_votes`;
      await sql`
        CREATE TRIGGER trigger_update_reputation_on_comment_vote
          AFTER INSERT OR DELETE ON comment_votes
          FOR EACH ROW
          EXECUTE FUNCTION update_author_reputation_on_vote()
      `;
      results.steps.push("✅ Created trigger on comment_votes table");

      // 9. Initialize is_sme status for existing users
      const updateResult = await sql`
        UPDATE profiles
        SET is_sme = (reputation_score >= 100)
        WHERE is_sme IS DISTINCT FROM (reputation_score >= 100)
      `;
      results.steps.push(`✅ Initialized is_sme status for existing users (${updateResult.count} updated)`);

      // Get current SME users
      const smeUsers = await sql`
        SELECT id, full_name, email, reputation_score
        FROM profiles
        WHERE is_sme = true
        ORDER BY reputation_score DESC
        LIMIT 10
      `;

      results.smeUsers = smeUsers;
      results.success = true;

    } catch (error: any) {
      results.errors.push(error.message);
      throw error;
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
