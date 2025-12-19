"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkVibe } from "@/lib/vibe-check";
import { checkUserBanned, checkKeywordBlacklist, handleBlacklistedContent } from "@/lib/trust-safety";
import { moderateContent } from "@/lib/actions/moderate";

/**
 * Create a comment on a product/protocol
 * Guest users require AI moderation, authenticated users bypass it
 */
export async function createProductComment(
  protocolId: string,
  content: string,
  protocolSlug: string
): Promise<{ success: boolean; error?: string; commentId?: string }> {
  const user = await currentUser();
  const sql = getDb();

  // Trim and validate content
  const trimmedContent = content.trim();
  if (trimmedContent.length < 3) {
    return { success: false, error: "Comment must be at least 3 characters long" };
  }

  if (trimmedContent.length > 2000) {
    return { success: false, error: "Comment must be less than 2000 characters" };
  }

  // Guest users require AI moderation
  if (!user) {
    try {
      const vibeResult = await checkVibe(trimmedContent);
      if (!vibeResult.isSafe) {
        return { success: false, error: `Content not allowed: ${vibeResult.reason}` };
      }
    } catch (vibeError) {
      console.error("Vibe check error:", vibeError);
      return { success: false, error: "Content validation failed. Please try again." };
    }
  } else {
    // Authenticated users bypass AI moderation (SME Freedom)
    console.log("Skipping AI moderation for authenticated user (SME freedom)");
  }

  // Guest comments are supported for products with AI moderation
  // Authenticated users bypass moderation

  let result: { success: boolean; error?: string; commentId?: string };

  try {
    // Ensure protocolId is a valid UUID string
    if (!protocolId || typeof protocolId !== 'string') {
      result = { 
        success: false, 
        error: "Invalid product ID" 
      };
    } else {
      // Insert comment - handle both authenticated and guest users
      const insertData: any = {
        protocol_id: protocolId,
        content: trimmedContent,
        flag_count: 0,
        is_flagged: false,
      };

      if (user) {
        // Check if user is banned
        const isBanned = await checkUserBanned(user.id);
        if (isBanned) {
          return { 
            success: false, 
            error: "Your laboratory access has been restricted" 
          };
        }

        // Authenticated user
        const authorId = String(user.id);
        if (!authorId || authorId.trim() === '') {
          result = { 
            success: false, 
            error: "Invalid user ID" 
          };
        } else {
          // Check keyword blacklist (Revenue Guard)
          const blacklistMatches = await checkKeywordBlacklist(trimmedContent);
          const shouldAutoFlag = blacklistMatches.length > 0;

          console.log('Insert Data:', {
            protocol_id: protocolId,
            author_id: authorId,
            content: trimmedContent,
            flag_count: shouldAutoFlag ? 1 : 0,
            is_flagged: shouldAutoFlag,
          });

          try {
            // Insert comment using raw SQL
            const insertResult = await sql`
              INSERT INTO product_comments (
                protocol_id, author_id, content, flag_count, is_flagged
              )
              VALUES (
                ${protocolId}, ${authorId}, ${trimmedContent},
                ${shouldAutoFlag ? 1 : 0}, ${shouldAutoFlag}
              )
              RETURNING id
            `;

            const insertedComment = insertResult[0];

            if (!insertedComment || !insertedComment.id) {
              console.error("Comment insert returned no data");
              result = { 
                success: false, 
                error: "Comment was not created. Please try again." 
              };
            } else {
              console.log("Comment successfully created:", insertedComment.id);
              
              // If blacklisted keyword found, auto-flag and move to moderation queue
              if (shouldAutoFlag && blacklistMatches.length > 0) {
                await handleBlacklistedContent(
                  insertedComment.id,
                  "product",
                  trimmedContent,
                  undefined,
                  protocolId,
                  authorId,
                  undefined,
                  undefined,
                  new Date().toISOString()
                );
                console.log("Comment auto-flagged due to blacklisted keyword:", blacklistMatches[0].keyword);
              }

              result = { 
                success: true, 
                commentId: insertedComment.id 
              };
            }
          } catch (error: any) {
            console.error("Error creating comment:", error);
            console.error("Protocol ID:", protocolId);
            console.error("Author ID (user.id):", authorId);
            
            // Return structured error instead of throwing
            let errorMessage = "Failed to create comment";
            
            if (error.message?.includes("does not exist") || error.code === "42P01") {
              errorMessage = "Product comments table not found. Please run the SQL migration.";
            } else if (error.message?.includes("foreign key") || error.code === "23503") {
              errorMessage = "Database constraint error. Please ensure the product exists and your profile is set up correctly.";
            } else if (error.message?.includes("permission") || error.code === "42501") {
              errorMessage = "Permission denied. Please contact support.";
            } else {
              errorMessage = `Failed to create comment: ${error.message || "Unknown error"}`;
            }
            
            result = { 
              success: false, 
              error: errorMessage 
            };
          }
        }
      } else {
        // Guest user - will be handled by createGuestProductComment
        result = { 
          success: false, 
          error: "Use createGuestProductComment for guest comments" 
        };
      }
    }
  } catch (err) {
    console.error("Unexpected error in createProductComment:", err);
    result = { 
      success: false, 
      error: err instanceof Error ? err.message : "An unexpected error occurred" 
    };
  }

  // Only revalidate on success
  if (result.success) {
    revalidatePath(`/products/${protocolSlug}`, "page");
    revalidatePath(`/products/[id]`, "page");
    revalidatePath("/products", "page");
  }

  return result;
}

/**
 * Create a guest comment on a product/protocol
 * Requires AI moderation via OpenAI Moderation API
 */
export async function createGuestProductComment(
  protocolId: string,
  content: string,
  guestName: string,
  protocolSlug: string
): Promise<{ success: boolean; error?: string; commentId?: string }> {
  const user = await currentUser();
  const sql = getDb();

  // Ensure user is NOT authenticated (this is for guests only)
  if (user) {
    return { 
      success: false, 
      error: "Authenticated users should use createProductComment" 
    };
  }

  // Validate guest name
  const trimmedGuestName = guestName.trim();
  if (!trimmedGuestName || trimmedGuestName.length < 2) {
    return { success: false, error: "Guest name must be at least 2 characters long" };
  }
  if (trimmedGuestName.length > 50) {
    return { success: false, error: "Guest name must be less than 50 characters" };
  }

  // Trim and validate content
  const trimmedContent = content.trim();
  if (trimmedContent.length < 10) {
    return { success: false, error: "Comment must be at least 10 characters long" };
  }
  if (trimmedContent.length > 2000) {
    return { success: false, error: "Comment must be less than 2000 characters" };
  }

  // Guest users require AI moderation via OpenAI Moderation API
  const moderationResult = await moderateContent(trimmedContent);
  if (moderationResult.isFlagged) {
    return { 
      success: false, 
      error: "Content rejected by laboratory AI." 
    };
  }

  try {
    // Insert guest comment using raw SQL
    const result = await sql`
      INSERT INTO product_comments (
        protocol_id, author_id, guest_name, content, flag_count, is_flagged
      )
      VALUES (
        ${protocolId}, NULL, ${trimmedGuestName}, ${trimmedContent}, 0, false
      )
      RETURNING id
    `;

    const insertedComment = result[0];

    if (!insertedComment || !insertedComment.id) {
      return { 
        success: false, 
        error: "Comment was not created. Please try again." 
      };
    }

    // Revalidate paths
    revalidatePath(`/products/${protocolSlug}`, "page");
    revalidatePath(`/products/[id]`, "page");
    revalidatePath("/products", "page");

    return { 
      success: true, 
      commentId: insertedComment.id 
    };
  } catch (err: any) {
    console.error("Unexpected error in createGuestProductComment:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "An unexpected error occurred" 
    };
  }
}

/**
 * Create or update a product/protocol (Admin only)
 */
export async function createOrUpdateProduct(formData: FormData) {
  const user = await currentUser();
  if (!user) {
    throw new Error("You must be logged in to create products");
  }

  const sql = getDb();

  try {
    // Check if user is admin
    const profileResult = await sql`
      SELECT is_admin
      FROM profiles
      WHERE id = ${user.id}
    `;

    const profile = profileResult[0];

    if (!profile || !profile.is_admin) {
      throw new Error("Only administrators can create or update products");
    }

    const title = formData.get("title") as string;
    const problemSolved = formData.get("problem_solved") as string;
    const aiSummary = formData.get("ai_summary") as string | null;
    const buyUrl = formData.get("buy_url") as string | null;
    const discountCode = formData.get("discount_code") as string | null;
    const labTested = formData.get("lab_tested") === "on";
    const organic = formData.get("organic") === "on";
    const purityVerified = formData.get("purity_verified") === "on";
    const thirdPartyCoa = formData.get("third_party_coa") === "on";
    const certificationNotes = formData.get("certification_notes") as string | null;
    const labPdfUrl = formData.get("lab_pdf_url") as string | null;
    const referenceUrl = formData.get("reference_url") as string | null;
    const productId = formData.get("product_id") as string | null;

    if (!title || !problemSolved) {
      throw new Error("Title and problem solved are required");
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (productId) {
      // Update existing product
      await sql`
        UPDATE protocols
        SET title = ${title.trim()},
            problem_solved = ${problemSolved.trim()},
            slug = ${slug},
            reference_url = ${referenceUrl || null},
            ai_summary = ${aiSummary || null},
            buy_url = ${buyUrl || null},
            discount_code = ${discountCode || null},
            lab_tested = ${labTested},
            organic = ${organic},
            purity_verified = ${purityVerified},
            third_party_coa = ${thirdPartyCoa},
            certification_notes = ${certificationNotes || null},
            lab_pdf_url = ${labPdfUrl || null}
        WHERE id = ${productId}
      `;
    } else {
      // Create new product
      await sql`
        INSERT INTO protocols (
          title, problem_solved, slug, created_by, reference_url, ai_summary,
          buy_url, discount_code, lab_tested, organic, purity_verified,
          third_party_coa, certification_notes, lab_pdf_url
        )
        VALUES (
          ${title.trim()}, ${problemSolved.trim()}, ${slug}, ${user.id},
          ${referenceUrl || null}, ${aiSummary || null}, ${buyUrl || null},
          ${discountCode || null}, ${labTested}, ${organic}, ${purityVerified},
          ${thirdPartyCoa}, ${certificationNotes || null}, ${labPdfUrl || null}
        )
      `;
    }

    revalidatePath("/products");
    revalidatePath(`/products/${slug}`);
    revalidatePath("/admin/onboard");

    return { success: true, slug };
  } catch (error: any) {
    console.error("Error creating/updating product:", error);
    throw new Error(error.message || "Failed to create/update product");
  }
}

/**
 * Onboard a new product with SME certification (Admin only)
 * Sets is_sme_certified to true if all 3 verification criteria are met
 */
export async function onboardProduct(formData: FormData) {
  const user = await currentUser();
  if (!user) {
    throw new Error("You must be logged in to onboard products");
  }

  const sql = getDb();

  // Check if user is admin (checks both Clerk publicMetadata.role and profile.is_admin)
  const clerkRole = (user.publicMetadata?.role as string) || null;
  let isAdmin = clerkRole === "admin";

  if (!isAdmin) {
    try {
      // Use a direct query for admin check
      const profileResult = await sql`
        SELECT is_admin
        FROM profiles
        WHERE id = ${user.id}
      `;

      const profile = profileResult[0];

      if (!profile || !profile.is_admin) {
        throw new Error("Only administrators can onboard products");
      }
      isAdmin = true;
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      throw new Error("Failed to verify admin status. Please try again.");
    }
  }

  // Verify admin status one more time before proceeding
  if (!isAdmin) {
    throw new Error("Only administrators can onboard products");
  }

  const title = formData.get("title") as string;
  const problemSolved = formData.get("problem_solved") as string;
  const aiSummary = formData.get("ai_summary") as string | null;
  const buyUrl = formData.get("buy_url") as string | null;
  const sourceTransparency = formData.get("source_transparency") === "on";
  const purityTested = formData.get("purity_tested") === "on";
  const potencyVerified = formData.get("potency_verified") === "on";
  const excipientAudit = formData.get("excipient_audit") === "on";
  const operationalLegitimacy = formData.get("operational_legitimacy") === "on";
  const thirdPartyLabVerified = formData.get("third_party_lab_verified") === "on";
  const coaUrl = formData.get("coa_url") as string | null;
  const referenceUrl = formData.get("reference_url") as string | null;
  
  // Parse images array from JSON string
  // NOTE: We use "image_urls" instead of "images" because the file input uses "images"
  let images: string[] = [];
  const imagesJson = formData.get("image_urls") as string | null;
  console.log("onboardProduct - Image URLs JSON received:", imagesJson);
  
  // Fallback: Also check "images" in case of old form submissions
  const fallbackImagesJson = imagesJson ? null : (formData.get("images") as string | null);
  const finalImagesJson = imagesJson || fallbackImagesJson;
  
  if (finalImagesJson) {
    try {
      // Check if it's a File object (shouldn't happen, but handle it)
      // Type guard: if it's not a string, it might be a File
      if (typeof finalImagesJson !== 'string') {
        console.error("onboardProduct - Received non-string value instead of JSON string!");
        console.error("This means the file input wasn't removed from FormData");
        console.error("Type received:", typeof finalImagesJson);
      } else {
        images = JSON.parse(finalImagesJson);
        console.log("onboardProduct - Parsed images array:", images);
        console.log("onboardProduct - Images count:", images.length);
        images.forEach((img, idx) => {
          console.log(`  Image ${idx}:`, img);
        });
      }
    } catch (e) {
      console.error("Error parsing images JSON:", e);
      console.error("Raw value received:", finalImagesJson);
    }
  } else {
    console.warn("onboardProduct - No image URLs JSON found in form data");
    console.warn("Available form data keys:", Array.from(formData.keys()));
  }

  if (!title || !problemSolved || !aiSummary || !buyUrl) {
    throw new Error("Title, problem solved, AI summary, and buy URL are required");
  }

  // Check if all 5 verification pillars are met for SME certification
  const isSMECertified = sourceTransparency && purityTested && potencyVerified && excipientAudit && operationalLegitimacy;

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Append ?ref=SME to buy_url
  const buyUrlWithRef = buyUrl.includes("?")
    ? `${buyUrl}&ref=SME`
    : `${buyUrl}?ref=SME`;

  // Ensure images is properly formatted as an array for PostgreSQL TEXT[]
  // PostgreSQL arrays need to be actual arrays, not JSON strings
  const imagesForDb = images.length > 0 ? images : null;
  
  console.log("onboardProduct - Preparing images for database:");
  console.log("  Images array:", images);
  console.log("  Images for DB:", imagesForDb);
  console.log("  Is array?", Array.isArray(imagesForDb));

  const productData: any = {
    title: title.trim(),
    problem_solved: problemSolved.trim(),
    slug,
    created_by: user.id,
    reference_url: referenceUrl || null,
    ai_summary: aiSummary.trim(),
    buy_url: buyUrlWithRef,
    is_sme_certified: isSMECertified,
    source_transparency: sourceTransparency,
    purity_tested: purityTested,
    potency_verified: potencyVerified,
    excipient_audit: excipientAudit,
    operational_legitimacy: operationalLegitimacy,
    third_party_lab_verified: thirdPartyLabVerified,
    coa_url: coaUrl || null,
    images: imagesForDb, // Use the prepared array
  };

  console.log("onboardProduct - Product data being saved:", {
    ...productData,
    images: productData.images, // Log images separately
  });
  console.log("onboardProduct - Images array being saved:", productData.images);
  console.log("onboardProduct - Images array type:", Array.isArray(productData.images));
  console.log("onboardProduct - Images array length:", productData.images?.length || 0);

  // CRITICAL: Ensure images is always an array (not null) if we have images
  if (images.length > 0 && !productData.images) {
    console.error("ERROR: Images were parsed but not included in productData!");
    productData.images = images;
  }

  try {
    // Insert product using raw SQL
    const result = await sql`
      INSERT INTO protocols (
        title, problem_solved, slug, created_by, reference_url, ai_summary, buy_url,
        is_sme_certified, source_transparency, purity_tested, potency_verified,
        excipient_audit, operational_legitimacy, third_party_lab_verified, coa_url,
        images
      )
      VALUES (
        ${productData.title}, ${productData.problem_solved}, ${productData.slug},
        ${productData.created_by}, ${productData.reference_url}, ${productData.ai_summary},
        ${productData.buy_url}, ${productData.is_sme_certified}, ${productData.source_transparency},
        ${productData.purity_tested}, ${productData.potency_verified}, ${productData.excipient_audit},
        ${productData.operational_legitimacy}, ${productData.third_party_lab_verified},
        ${productData.coa_url}, ${imagesForDb ? sql.array(imagesForDb) : null}
      )
      RETURNING slug, id, images
    `;

    const insertedData = result[0];
    const insertedId = insertedData?.id || null;
    const insertedSlug = insertedData?.slug || slug;
    const insertedImages = insertedData?.images || null;
  
  console.log("onboardProduct - Product created successfully:");
  console.log("  ID:", insertedId);
  console.log("  Slug:", insertedSlug);
  console.log("  Images saved in DB:", insertedImages);
  console.log("  Images type:", typeof insertedImages);
  console.log("  Images is array?", Array.isArray(insertedImages));
  
  // CRITICAL VERIFICATION: Check if images were actually saved
  if (images.length > 0) {
    if (!insertedImages || (Array.isArray(insertedImages) && insertedImages.length === 0)) {
      console.error("⚠️ WARNING: Images were uploaded but NOT saved to database!");
      console.error("  Expected images:", images);
      console.error("  Saved images:", insertedImages);
      
      // ATTEMPT FIX: Try to update the product with images directly
      if (insertedId) {
        console.log("Attempting to fix by updating product with images...");
        try {
          const updateResult = await sql`
            UPDATE protocols
            SET images = ${sql.array(images)}
            WHERE id = ${insertedId}
            RETURNING images
          `;
          console.log("✅ Fixed: Images updated successfully:", updateResult[0]?.images);
        } catch (updateError) {
          console.error("Failed to update images:", updateError);
        }
      }
    } else {
      console.log("✅ SUCCESS: Images were saved to database");
      console.log("  Saved images count:", Array.isArray(insertedImages) ? insertedImages.length : "N/A");
    }
  }

    if (!insertedId) {
      throw new Error("Failed to create product: No ID returned");
    }

    revalidatePath("/products");
    revalidatePath(`/products/${insertedId}`);
    revalidatePath("/admin/add-product");
    revalidatePath("/admin");

    return { success: true, id: insertedId, slug: insertedSlug };
  } catch (error: any) {
    console.error("Error creating product:", error);
    console.error("Product data:", productData);
    
    // Provide more specific error messages
    if (error.code === "42501") {
      throw new Error("Permission denied. Please ensure you have admin access.");
    } else if (error.code === "23505") {
      throw new Error("A product with this slug already exists. Please use a different title.");
    } else {
      throw new Error(error.message || "Failed to create product");
    }
  }
}

