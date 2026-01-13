export type ReactionType = 'scientific' | 'experiential' | 'safety' | 'innovation' | 'reliability';

export const REACTION_EMOJIS: Record<ReactionType, string> = {
    scientific: '🔬',
    experiential: '💡',
    safety: '⚠️',
    innovation: '💎',
    reliability: '✅'
};

export const REACTION_LABELS: Record<ReactionType, string> = {
    scientific: 'Scientific Insight',
    experiential: 'Experiential Wisdom',
    safety: 'Potential Concern',
    innovation: 'Groundbreaking Idea',
    reliability: 'Tried and True'
};

export const REACTION_DESCRIPTIONS: Record<ReactionType, string> = {
    scientific: 'Evidence-based scientific insight, research, or data.',
    experiential: 'Valuable personal experience or holistic perspective.',
    safety: 'Raises valid concerns or safety warnings.',
    innovation: 'Novel perspective or groundbreaking idea.',
    reliability: 'Confirmed truth or tried-and-true method.'
};
