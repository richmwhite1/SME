"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

/**
 * Submit brand claim to product_onboarding table
 */
export async function submitBrandClaim(params: {
    productId: string;
    workEmail: string;
    linkedinProfile: string;
    companyWebsite: string;
    founderComments?: string;
    intentionStatement: string;
    labReportUrl?: string;
}) {
    try {
        const sql = getDb();
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        // Validate URLs
        const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.+/;
        const urlRegex = /^https?:\/\/.+\..+/;

        if (!linkedinRegex.test(params.linkedinProfile)) {
            return { success: false, error: "Invalid LinkedIn profile URL" };
        }

        if (!urlRegex.test(params.companyWebsite)) {
            return { success: false, error: "Invalid company website URL" };
        }

        // Validate lab report URL if provided
        if (params.labReportUrl && !urlRegex.test(params.labReportUrl)) {
            return { success: false, error: "Invalid lab report URL" };
        }

        // Validate intention statement
        if (!params.intentionStatement || params.intentionStatement.length < 50) {
            return { success: false, error: "Intention statement must be at least 50 characters" };
        }

        // Check if product exists
        const productCheck = await sql`
      SELECT id, title, brand_owner_id FROM products WHERE id = ${params.productId}
    `;

        if (productCheck.length === 0) {
            return { success: false, error: "Product not found" };
        }

        // Check if product is already claimed
        if (productCheck[0].brand_owner_id) {
            return { success: false, error: "This product is already claimed" };
        }

        // Check for duplicate pending claims from this user for this product
        const existingClaim = await sql`
      SELECT id FROM product_onboarding 
      WHERE product_id = ${params.productId}
      AND user_id = ${userId}
      AND submission_type = 'brand_claim'
      AND verification_status = 'pending'
    `;

        if (existingClaim.length > 0) {
            return {
                success: false,
                error: "You already have a pending claim for this product"
            };
        }

        // Create brand claim in product_onboarding
        const claim = await sql`
      INSERT INTO product_onboarding (
        product_id,
        user_id,
        submission_type,
        proposed_data,
        verification_status
      ) VALUES (
        ${params.productId},
        ${userId},
        'brand_claim',
        ${JSON.stringify({
            work_email: params.workEmail,
            linkedin_profile: params.linkedinProfile,
            company_website: params.companyWebsite,
            founder_comments: params.founderComments || null,
            intention_statement: params.intentionStatement,
            lab_report_url: params.labReportUrl || null
        })},
        'pending'
      )
      RETURNING id
    `;

        const claimId = claim[0].id;

        console.log(`✅ Brand claim submitted: ${claimId} for product ${params.productId} by user ${userId}`);

        return {
            success: true,
            claimId,
            message: "Brand claim submitted successfully"
        };
    } catch (error) {
        console.error("Error submitting brand claim:", error);
        return {
            success: false,
            error: "Failed to submit claim. Please try again.",
        };
    }
}
