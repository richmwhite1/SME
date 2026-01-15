/**
 * SME Scoring Constants
 * 
 * Client-safe constants that can be imported in both client and server components.
 */

// Constants for scoring
export const SME_PILLARS = [
    "Purity", "Bioavailability", "Potency", "Evidence",
    "Sustainability", "Experience", "Safety", "Transparency", "Synergy"
] as const;

export const CHAKRA_LEVELS = [
    { level: 1, name: 'Red Chakra', title: 'Rooted Member', threshold: 0, color: 'text-red-500' },
    { level: 2, name: 'Orange Chakra', title: 'Creative Contributor', threshold: 100, color: 'text-orange-500' },
    { level: 3, name: 'Yellow Chakra', title: 'Trusted Voice', threshold: 300, color: 'text-yellow-500' },
    { level: 4, name: 'Green Chakra', title: 'Heart of Community', threshold: 600, color: 'text-green-500' },
    { level: 5, name: 'Blue Chakra', title: 'Insightful Guide', threshold: 1000, color: 'text-blue-500' },
    { level: 6, name: 'Indigo Chakra', title: 'Visionary Lead', threshold: 2000, color: 'text-indigo-500' },
    { level: 7, name: 'Violet Chakra', title: 'Unified Expert', threshold: 5000, color: 'text-violet-500' }
] as const;

export const POINTS = {
    // contributions (WCS Base Weights)
    CITATION: 30, // x3 multiplier vs baseline 10
    REVIEW: 20,   // x2 multiplier
    COMMENT: 10,  // x1 baseline

    // Negative Feedback
    NEGATIVE_FEEDBACK: -20, // x-2 multiplier

    // Thresholds
    PILLAR_EXPERTISE_THRESHOLD: 500, // WCS needed in a specific pillar

    // Interactions Received (Secondary)
    UPVOTE_RECEIVED: 2,

    // Emoticon Reactions Received (Weighted)
    REACTION_SCIENTIFIC_INSIGHT: 10, // 🔬
    REACTION_EXPERIENTIAL_WISDOM: 8, // 🧠
    REACTION_POTENTIAL_CONCERN: 5,   // ⚠️ (Still positive for engagement/warning)
    REACTION_GROUNDBREAKING_IDEA: 12,// 💡
    REACTION_TRIED_AND_TRUE: 8,      // 🤝

    // Status Bonuses
    VERIFIED_EXPERT_BONUS: 500, // One-time or persistent base
};

/**
 * Calculate the Chakra level based on a numeric score
 */
export function getChakraLevel(score: number) {
    for (let i = CHAKRA_LEVELS.length - 1; i >= 0; i--) {
        if (score >= CHAKRA_LEVELS[i].threshold) {
            return CHAKRA_LEVELS[i];
        }
    }
    return CHAKRA_LEVELS[0];
}

/**
 * Calculate the next level and points needed
 */
export function getNextChakraLevel(currentLevel: number) {
    if (currentLevel >= 7) return null;
    return CHAKRA_LEVELS.find(l => l.level === currentLevel + 1) || null;
}
