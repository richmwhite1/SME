import { getGemmaClient } from './gemma-client';
import { getDb } from '../db/server';

/**
 * Auto-Tagger with Credibility Weighting
 * Suggests tags for products and discussions based on content and community validation
 */

export interface TagSuggestion {
    tag: string;
    confidence: number; // 0-1
    source: 'community' | 'sme' | 'ai';
    credibilityScore: number;
}

// Master topics from database
const MASTER_TOPICS = [
    'Biohacking',
    'Longevity',
    'Research',
    'Supplements',
    'Nutrition',
    'Wellness',
    'Gut Health',
    'Mental Health',
    'Fitness',
    'Sleep',
    'Hormones',
    'Prevention',
];

/**
 * Suggest tags for content using Gemma and credibility weighting
 */
export async function suggestTags(
    content: string,
    contentType: 'product' | 'discussion',
    authorCredibility?: {
        isSme: boolean;
        reputationScore: number;
    }
): Promise<TagSuggestion[]> {
    const gemma = getGemmaClient();
    const db = getDb();

    try {
        // Use Gemma to suggest initial tags
        const prompt = `Suggest relevant tags for this ${contentType} from the following list: ${MASTER_TOPICS.join(', ')}

Content: "${content}"

Instructions:
1. Select 2-4 most relevant tags from the list
2. Return as JSON array of tag names only
3. Be specific and accurate

Example: ["Supplements", "Sleep", "Wellness"]

Tags:`;

        const response = await gemma.generateText('gemma-2-2b-it', prompt, {
            temperature: 0.3,
            maxTokens: 100,
        });

        // Parse AI suggestions
        const aiTags = JSON.parse(response) as string[];

        // Get community-validated tags (from high-upvote content with similar keywords)
        const keywords = content.toLowerCase().split(' ').slice(0, 10);
        const searchPattern = keywords.join(' | ');

        let communityTags: string[] = [];
        if (contentType === 'product') {
            const results = await db`
        SELECT DISTINCT UNNEST(tags) as tag, COUNT(*) as usage_count
        FROM products
        WHERE 
          is_sme_certified = true
          AND to_tsvector('english', title || ' ' || COALESCE(problem_solved, ''))
          @@ to_tsquery('english', ${searchPattern})
        GROUP BY tag
        ORDER BY usage_count DESC
        LIMIT 3
      `;
            communityTags = results.map((r: any) => r.tag);
        } else {
            const results = await db`
        SELECT DISTINCT UNNEST(tags) as tag, COUNT(*) as usage_count
        FROM discussions
        WHERE 
          upvote_count >= 5
          AND to_tsvector('english', title || ' ' || content)
          @@ to_tsquery('english', ${searchPattern})
        GROUP BY tag
        ORDER BY usage_count DESC
        LIMIT 3
      `;
            communityTags = results.map((r: any) => r.tag);
        }

        // Combine and score suggestions
        const suggestions: TagSuggestion[] = [];
        const seenTags = new Set<string>();

        // Add AI suggestions
        for (const tag of aiTags) {
            if (MASTER_TOPICS.includes(tag) && !seenTags.has(tag)) {
                seenTags.add(tag);

                // Base confidence from AI
                let confidence = 0.7;
                let credibilityScore = 50;

                // Boost if also suggested by community
                if (communityTags.includes(tag)) {
                    confidence += 0.2;
                    credibilityScore += 30;
                }

                // Boost if author is SME
                if (authorCredibility?.isSme) {
                    confidence += 0.1;
                    credibilityScore += 20;
                }

                suggestions.push({
                    tag,
                    confidence: Math.min(1, confidence),
                    source: 'ai',
                    credibilityScore: Math.min(100, credibilityScore),
                });
            }
        }

        // Add community-validated tags not already included
        for (const tag of communityTags) {
            if (!seenTags.has(tag) && MASTER_TOPICS.includes(tag)) {
                seenTags.add(tag);
                suggestions.push({
                    tag,
                    confidence: 0.85, // High confidence for community-validated
                    source: 'community',
                    credibilityScore: 80,
                });
            }
        }

        // Sort by confidence
        suggestions.sort((a, b) => b.confidence - a.confidence);

        return suggestions.slice(0, 5); // Return top 5
    } catch (error) {
        console.error('Error suggesting tags:', error);
        return [];
    }
}

/**
 * Auto-tag product based on description
 */
export async function autoTagProduct(
    title: string,
    description: string,
    submitterId?: string
): Promise<string[]> {
    const db = getDb();

    // Get submitter credibility if available
    let authorCredibility;
    if (submitterId) {
        const [profile] = await db`
      SELECT 
        COALESCE(is_sme, is_verified_expert, false) as is_sme,
        reputation_score
      FROM profiles
      WHERE id = ${submitterId}
    `;
        authorCredibility = profile ? {
            isSme: profile.is_sme,
            reputationScore: profile.reputation_score || 0,
        } : undefined;
    }

    const content = `${title}\n${description}`;
    const suggestions = await suggestTags(content, 'product', authorCredibility);

    // Return tags with confidence >= 0.7
    return suggestions
        .filter(s => s.confidence >= 0.7)
        .map(s => s.tag);
}

/**
 * Auto-tag discussion based on title and content
 */
export async function autoTagDiscussion(
    title: string,
    content: string,
    authorId: string
): Promise<string[]> {
    const db = getDb();

    // Get author credibility
    const [profile] = await db`
    SELECT 
      COALESCE(is_sme, is_verified_expert, false) as is_sme,
      reputation_score
    FROM profiles
    WHERE id = ${authorId}
  `;

    const authorCredibility = profile ? {
        isSme: profile.is_sme,
        reputationScore: profile.reputation_score || 0,
    } : undefined;

    const fullContent = `${title}\n${content}`;
    const suggestions = await suggestTags(fullContent, 'discussion', authorCredibility);

    // Return tags with confidence >= 0.7
    return suggestions
        .filter(s => s.confidence >= 0.7)
        .map(s => s.tag);
}
