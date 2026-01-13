/**
 * Platform Terminology Definitions
 * Centralized source of truth for tooltip content and user-facing explanations
 */

export const TERMINOLOGY = {
    PILLAR_SCORE: "The 9-Pillar Audit: A comprehensive technical deep-dive evaluating Purity, Potency, Evidence, and more. A higher count indicates more verified standards have been met.",
    TRUST_WEIGHT: "Evidence-backed sentiment from verified experts.",
    SPECIMEN_UNDER_AUDIT: "A product currently undergoing community and expert review.",
    SIGNAL: "High-value, credible information validated by scientific evidence and community consensus.",
    COMMUNITY_SIGNALS: "Total verified contributions (reviews + comments) from the wider community, representing general consensus and real-world usage.",
    SME_REVIEWS: "Authoritative, deep-dive audits conducted by verified Subject Matter Experts. These provide the technical backbone for our quality assessments.",
    NOISE: "Misinformation, marketing fluff, and unverified claims that we filter out.",
    NINE_PILLAR_ANALYSIS: "Our rigorous 9-point evaluation framework assessing Purity, Bioavailability, Potency, Evidence, Sustainability, Experience, Safety, Transparency, and Synergy.",
} as const;

export type TerminologyKey = keyof typeof TERMINOLOGY;
