
import { getDb } from '../lib/db';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function fixReputationFunction() {
    const sql = getDb();
    console.log("Applying fix to calculate_detailed_reputation function...");

    try {
        await sql`
            CREATE OR REPLACE FUNCTION calculate_detailed_reputation(user_id_param TEXT)
            RETURNS TABLE (
              total_score INTEGER,
              scientific_score INTEGER,
              experiential_score INTEGER,
              safety_score INTEGER,
              innovation_score INTEGER,
              reliability_score INTEGER
            ) AS $$
            DECLARE
              v_upvote_score INTEGER := 0;
              v_scientific_count INTEGER := 0;
              v_experiential_count INTEGER := 0;
              v_safety_count INTEGER := 0;
              v_innovation_count INTEGER := 0;
              v_reliability_count INTEGER := 0;
              
              -- Weights
              w_scientific CONSTANT INTEGER := 5;
              w_innovation CONSTANT INTEGER := 5;
              w_experiential CONSTANT INTEGER := 3;
              w_reliability CONSTANT INTEGER := 2;
              w_safety CONSTANT INTEGER := 0; -- Safety doesn't add to total directly, but tracked separately
            BEGIN
              -- 1. Calculate base upvotes (existing logic)
              -- Count upvotes on user's discussions
              SELECT COALESCE(SUM(d.upvote_count), 0) INTO v_upvote_score
              FROM discussions d
              WHERE d.author_id = user_id_param;
              
              -- Add upvotes on user's discussion comments
              v_upvote_score := v_upvote_score + (
                SELECT COALESCE(SUM(dc.upvote_count), 0)
                FROM discussion_comments dc
                WHERE dc.author_id = user_id_param
              );
              
              -- Add upvotes on user's product comments
              v_upvote_score := v_upvote_score + (
                SELECT COALESCE(SUM(pc.upvote_count), 0)
                FROM product_comments pc
                WHERE pc.author_id = user_id_param  -- FIXED: user_id -> author_id
              );
            
              -- 2. Calculate Reaction Counts across all comments (Discussion + Product)
              
              -- Scientific (Discussion Comments)
              SELECT COALESCE(COUNT(*), 0) INTO v_scientific_count
              FROM discussion_comment_reactions dcr
              JOIN discussion_comments dc ON dc.id = dcr.comment_id
              WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'scientific';
              
              -- Scientific (Product Comments)
              v_scientific_count := v_scientific_count + (
                SELECT COALESCE(COUNT(*), 0)
                FROM product_comment_reactions pcr
                JOIN product_comments pc ON pc.id = pcr.comment_id
                WHERE pc.author_id = user_id_param AND pcr.reaction_type = 'scientific' -- FIXED
              );
            
              -- Experiential (Discussion Comments)
              SELECT COALESCE(COUNT(*), 0) INTO v_experiential_count
              FROM discussion_comment_reactions dcr
              JOIN discussion_comments dc ON dc.id = dcr.comment_id
              WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'experiential';
              
              -- Experiential (Product Comments)
              v_experiential_count := v_experiential_count + (
                SELECT COALESCE(COUNT(*), 0)
                FROM product_comment_reactions pcr
                JOIN product_comments pc ON pc.id = pcr.comment_id
                WHERE pc.author_id = user_id_param AND pcr.reaction_type = 'experiential' -- FIXED
              );
            
              -- Safety (Discussion Comments)
              SELECT COALESCE(COUNT(*), 0) INTO v_safety_count
              FROM discussion_comment_reactions dcr
              JOIN discussion_comments dc ON dc.id = dcr.comment_id
              WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'safety';
              
              -- Safety (Product Comments)
              v_safety_count := v_safety_count + (
                SELECT COALESCE(COUNT(*), 0)
                FROM product_comment_reactions pcr
                JOIN product_comments pc ON pc.id = pcr.comment_id
                WHERE pc.author_id = user_id_param AND pcr.reaction_type = 'safety' -- FIXED
              );
            
              -- Innovation (Discussion Comments)
              SELECT COALESCE(COUNT(*), 0) INTO v_innovation_count
              FROM discussion_comment_reactions dcr
              JOIN discussion_comments dc ON dc.id = dcr.comment_id
              WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'innovation';
              
              -- Innovation (Product Comments)
              v_innovation_count := v_innovation_count + (
                SELECT COALESCE(COUNT(*), 0)
                FROM product_comment_reactions pcr
                JOIN product_comments pc ON pc.id = pcr.comment_id
                WHERE pc.author_id = user_id_param AND pcr.reaction_type = 'innovation' -- FIXED
              );
            
              -- Reliability (Discussion Comments)
              SELECT COALESCE(COUNT(*), 0) INTO v_reliability_count
              FROM discussion_comment_reactions dcr
              JOIN discussion_comments dc ON dc.id = dcr.comment_id
              WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'reliability';
              
              -- Reliability (Product Comments)
              v_reliability_count := v_reliability_count + (
                SELECT COALESCE(COUNT(*), 0)
                FROM product_comment_reactions pcr
                JOIN product_comments pc ON pc.id = pcr.comment_id
                WHERE pc.author_id = user_id_param AND pcr.reaction_type = 'reliability' -- FIXED
              );
            
              -- 3. Return Granular Scores
              RETURN QUERY SELECT 
                (v_upvote_score + 
                 (v_scientific_count * w_scientific) + 
                 (v_innovation_count * w_innovation) + 
                 (v_experiential_count * w_experiential) + 
                 (v_reliability_count * w_reliability) + 
                 (v_safety_count * w_safety)
                )::INTEGER as total_score,
                v_scientific_count::INTEGER,
                v_experiential_count::INTEGER,
                v_safety_count::INTEGER,
                v_innovation_count::INTEGER,
                v_reliability_count::INTEGER;
            END;
            $$ LANGUAGE plpgsql;
        `;
        console.log("Fix applied successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}

fixReputationFunction();
