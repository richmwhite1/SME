"use server";

import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export interface SmeSummons {
    id: string;
    product_id: string;
    priority: number;
    lens: string;
    red_flags_count: number;
    is_resolved: boolean;
    product_title: string;
    product_slug: string;
    product_image: string | null;
    created_at: Date;
}

export async function getTopSmeSummons(limit: number = 5): Promise<SmeSummons[]> {
    const sql = getDb();

    try {
        const results = await sql`
      SELECT 
        s.id,
        s.product_id,
        s.priority,
        s.lens,
        s.red_flags_count,
        s.is_resolved,
        s.created_at,
        p.title as product_title,
        p.slug as product_slug,
        p.images[1] as product_image
      FROM sme_summons s
      JOIN products p ON s.product_id = p.id
      WHERE s.is_resolved = false
      ORDER BY s.priority DESC, s.red_flags_count DESC
      LIMIT ${limit}
    `;

        return results.map(r => ({
            id: r.id,
            product_id: r.product_id,
            priority: r.priority,
            lens: r.lens,
            red_flags_count: r.red_flags_count,
            is_resolved: r.is_resolved,
            product_title: r.product_title,
            product_slug: r.product_slug,
            product_image: r.product_image,
            created_at: new Date(r.created_at)
        }));
    } catch (error) {
        console.error("Error fetching SME summons:", error);
        return [];
    }
}

/**
 * Submits expert profile for SME review
 * Updates profile with preferred topics and creates/updates SME application
 */
export async function submitExpertProfile(prevState: any, formData: FormData) {
    const user = await currentUser();

    if (!user) {
        return {
            success: false,
            message: "You must be logged in to submit an expert profile",
            errors: undefined
        };
    }

    const sql = getDb();

    try {
        // Extract and validate form data
        const topicsJson = formData.get('topics') as string;
        const expertiseType = formData.get('expertise_type') as string;
        const experienceLineage = formData.get('experience_lineage') as string;
        const portfolioUrl = formData.get('portfolio_url') as string | null;

        // Validation
        if (!topicsJson || !expertiseType || !experienceLineage) {
            return {
                success: false,
                message: "Please complete all required fields",
                errors: {
                    topics: !topicsJson ? ["Please select at least one topic"] : undefined,
                    expertise_type: !expertiseType ? ["Please select your expertise type"] : undefined,
                    experience_lineage: !experienceLineage ? ["Please describe your experience"] : undefined
                }
            };
        }

        const selectedTopics = JSON.parse(topicsJson);

        if (!Array.isArray(selectedTopics) || selectedTopics.length === 0) {
            return {
                success: false,
                message: "Please select at least one topic of expertise",
                errors: { topics: ["At least one topic is required"] }
            };
        }

        if (!['Scientific', 'Alternative', 'Esoteric'].includes(expertiseType)) {
            return {
                success: false,
                message: "Invalid expertise type selected",
                errors: { expertise_type: ["Please select a valid expertise type"] }
            };
        }

        // Execute database transaction
        await sql.begin(async (tx) => {
            // Update profile with preferred topics and mark profile as completed
            await tx`
                UPDATE profiles
                SET 
                    preferred_topics = ${sql.array(selectedTopics)},
                    has_completed_expert_profile = true,
                    updated_at = NOW()
                WHERE id = ${user.id}
            `;

            // Check if SME application already exists
            const existingApp = await tx`
                SELECT id FROM sme_applications
                WHERE user_id = ${user.id}
                LIMIT 1
            `;

            if (existingApp.length > 0) {
                // Update existing application
                await tx`
                    UPDATE sme_applications
                    SET 
                        expertise_lens = ${expertiseType},
                        statement_of_intent = ${experienceLineage},
                        expertise_lineage = ${experienceLineage},
                        portfolio_url = ${portfolioUrl || null},
                        status = 'pending',
                        updated_at = NOW()
                    WHERE user_id = ${user.id}
                `;
            } else {
                // Create new application
                await tx`
                    INSERT INTO sme_applications (
                        user_id,
                        expertise_lens,
                        statement_of_intent,
                        expertise_lineage,
                        portfolio_url,
                        status
                    ) VALUES (
                        ${user.id},
                        ${expertiseType},
                        ${experienceLineage},
                        ${experienceLineage},
                        ${portfolioUrl || null},
                        'pending'
                    )
                `;
            }
        });

        return {
            success: true,
            message: "Expert profile submitted successfully! Your application is now pending admin review.",
            errors: undefined
        };
    } catch (error) {
        console.error("Error submitting expert profile:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to submit expert profile. Please try again.",
            errors: undefined
        };
    }
}
