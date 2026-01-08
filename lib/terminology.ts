/**
 * Platform Terminology Definitions
 * Centralized source of truth for tooltip content and user-facing explanations
 */

export const TERMINOLOGY = {
    PILLAR_SCORE: "5 levels of transparency from source to lab.",
    TRUST_WEIGHT: "Evidence-backed sentiment from verified experts.",
    SPECIMEN_UNDER_AUDIT: "A product currently undergoing community and expert review.",
} as const;

export type TerminologyKey = keyof typeof TERMINOLOGY;
