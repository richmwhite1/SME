export interface ResourceReference {
    resource_id: string;
    resource_title: string;
    resource_url: string | null;
}

export interface CommentProfile {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    badge_type: string | null;
    contributor_score: number | null;
    is_verified_expert?: boolean;
}

export interface Comment {
    id: string;
    content: string;
    created_at: string;
    parent_id?: string | null;
    children?: Comment[];
    guest_name?: string | null;
    insight_summary?: string | null;
    upvote_count?: number;
    raise_hand_count?: number; // New field
    is_official_response?: boolean; // New field
    is_flagged?: boolean;
    star_rating?: number | null; // 1-5 star rating for products
    profiles: CommentProfile | null;
    references?: ResourceReference[];
    reactions?: Array<{
        emoji: string;
        count: number;
        user_reacted: boolean;
    }>;
    // Allow index signature for extensions
    [key: string]: any;
}

