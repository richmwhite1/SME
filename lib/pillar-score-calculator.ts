/**
 * Pillar Score Calculator
 * Maps active ingredients to the 12 Pillars for SME Radar Chart
 */

export interface ActiveIngredient {
    name: string;
    dosage: string;
}

export interface PillarScores {
    "Biohacking": number;
    "Longevity": number;
    "Research": number;
    "Supplements": number;
    "Nutrition": number;
    "Wellness": number;
    "Gut Health": number;
    "Mental Health": number;
    "Fitness": number;
    "Sleep": number;
    "Hormones": number;
    "Prevention": number;
}

// Ingredient to pillar mapping database
const INGREDIENT_PILLAR_MAP: Record<string, Partial<PillarScores>> = {
    // Gut Health
    "curcumin": { "Gut Health": 85, "Prevention": 70, "Wellness": 60 },
    "turmeric": { "Gut Health": 80, "Prevention": 65, "Wellness": 55 },
    "probiotics": { "Gut Health": 95, "Wellness": 70, "Prevention": 60 },
    "l-glutamine": { "Gut Health": 75, "Fitness": 50, "Recovery": 60 },
    "ginger": { "Gut Health": 70, "Prevention": 55, "Wellness": 50 },
    "psyllium": { "Gut Health": 80, "Wellness": 50 },

    // Mental Health / Cognitive
    "ashwagandha": { "Mental Health": 85, "Hormones": 70, "Sleep": 65, "Wellness": 60 },
    "l-theanine": { "Mental Health": 80, "Sleep": 70, "Wellness": 55 },
    "rhodiola": { "Mental Health": 75, "Fitness": 60, "Wellness": 55 },
    "bacopa": { "Mental Health": 80, "Longevity": 50, "Wellness": 50 },
    "lion's mane": { "Mental Health": 85, "Longevity": 60, "Biohacking": 70 },
    "ginkgo biloba": { "Mental Health": 75, "Longevity": 55, "Prevention": 50 },

    // Sleep
    "melatonin": { "Sleep": 90, "Wellness": 60 },
    "magnesium": { "Sleep": 75, "Fitness": 60, "Wellness": 65, "Hormones": 50 },
    "valerian": { "Sleep": 80, "Mental Health": 55, "Wellness": 50 },
    "glycine": { "Sleep": 70, "Mental Health": 50, "Wellness": 45 },

    // Fitness / Performance
    "creatine": { "Fitness": 95, "Performance": 90, "Biohacking": 70 },
    "beta-alanine": { "Fitness": 85, "Performance": 80 },
    "citrulline": { "Fitness": 80, "Performance": 75, "Wellness": 50 },
    "bcaa": { "Fitness": 75, "Recovery": 70, "Performance": 65 },
    "hmb": { "Fitness": 70, "Recovery": 75, "Longevity": 50 },

    // Longevity / Anti-aging
    "nmn": { "Longevity": 95, "Biohacking": 90, "Prevention": 75 },
    "nad+": { "Longevity": 95, "Biohacking": 90, "Prevention": 75 },
    "resveratrol": { "Longevity": 85, "Prevention": 70, "Wellness": 60 },
    "quercetin": { "Longevity": 75, "Prevention": 70, "Wellness": 55 },
    "spermidine": { "Longevity": 80, "Biohacking": 75, "Prevention": 65 },

    // Hormones
    "dhea": { "Hormones": 85, "Longevity": 60, "Wellness": 50 },
    "tongkat ali": { "Hormones": 80, "Fitness": 65, "Wellness": 55 },
    "maca": { "Hormones": 75, "Wellness": 60, "Fitness": 50 },
    "tribulus": { "Hormones": 70, "Fitness": 55 },

    // General Wellness / Nutrition
    "vitamin d": { "Wellness": 85, "Prevention": 75, "Hormones": 60 },
    "vitamin c": { "Wellness": 80, "Prevention": 70, "Longevity": 50 },
    "omega-3": { "Wellness": 90, "Prevention": 80, "Mental Health": 70, "Longevity": 65 },
    "zinc": { "Wellness": 75, "Prevention": 65, "Hormones": 55 },
    "b-complex": { "Wellness": 80, "Mental Health": 60, "Fitness": 50 },

    // Biohacking
    "nootropics": { "Biohacking": 90, "Mental Health": 75 },
    "peptides": { "Biohacking": 95, "Longevity": 80, "Fitness": 70 },
    "adaptogens": { "Biohacking": 80, "Wellness": 70, "Mental Health": 65 },
};

/**
 * Calculate pillar scores based on active ingredients
 */
export function calculatePillarScores(
    activeIngredients: ActiveIngredient[]
): PillarScores {
    // Initialize all pillars to 0
    const scores: PillarScores = {
        "Biohacking": 0,
        "Longevity": 0,
        "Research": 0,
        "Supplements": 0,
        "Nutrition": 0,
        "Wellness": 0,
        "Gut Health": 0,
        "Mental Health": 0,
        "Fitness": 0,
        "Sleep": 0,
        "Hormones": 0,
        "Prevention": 0,
    };

    if (!activeIngredients || activeIngredients.length === 0) {
        return scores;
    }

    // Track how many ingredients contribute to each pillar
    const pillarContributions: Record<string, number> = {};

    // Process each ingredient
    activeIngredients.forEach((ingredient) => {
        const normalizedName = ingredient.name.toLowerCase().trim();

        // Check if we have a mapping for this ingredient
        const pillarMapping = INGREDIENT_PILLAR_MAP[normalizedName];

        if (pillarMapping) {
            // Add scores from this ingredient to the pillars
            Object.entries(pillarMapping).forEach(([pillar, score]) => {
                if (pillar in scores) {
                    scores[pillar as keyof PillarScores] += score;
                    pillarContributions[pillar] = (pillarContributions[pillar] || 0) + 1;
                }
            });
        }
    });

    // Average the scores (if multiple ingredients contribute to same pillar)
    Object.keys(pillarContributions).forEach((pillar) => {
        const count = pillarContributions[pillar];
        if (count > 1) {
            scores[pillar as keyof PillarScores] = Math.round(
                scores[pillar as keyof PillarScores] / count
            );
        }
    });

    // All products with ingredients get base scores for Supplements and Research
    if (activeIngredients.length > 0) {
        scores["Supplements"] = Math.max(scores["Supplements"], 70);
        scores["Research"] = Math.max(scores["Research"], 50);
    }

    // Cap all scores at 100
    Object.keys(scores).forEach((pillar) => {
        scores[pillar as keyof PillarScores] = Math.min(
            scores[pillar as keyof PillarScores],
            100
        );
    });

    return scores;
}

/**
 * Get ingredient suggestions based on partial input
 */
export function getIngredientSuggestions(query: string): string[] {
    if (!query || query.length < 2) {
        return [];
    }

    const normalizedQuery = query.toLowerCase();

    return Object.keys(INGREDIENT_PILLAR_MAP)
        .filter((ingredient) => ingredient.includes(normalizedQuery))
        .sort()
        .slice(0, 10); // Return top 10 matches
}

/**
 * Check if an ingredient is recognized in our database
 */
export function isRecognizedIngredient(ingredientName: string): boolean {
    const normalized = ingredientName.toLowerCase().trim();
    return normalized in INGREDIENT_PILLAR_MAP;
}
