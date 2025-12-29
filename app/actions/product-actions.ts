"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkVibe, checkVibeForGuest } from "@/lib/vibe-check";
import { checkUserBanned, checkKeywordBlacklist, handleBlacklistedContent } from "@/lib/trust-safety";
import { generateInsight } from "@/lib/ai/insight-engine";
import { createNotification } from "@/app/actions/notifications";

/**
 * Create a comment on a product/protocol
 * Guest users require AI moderation, authenticated users bypass it
 */
export async function createProductComment(
  productId: string,
  content: string,
  productSlug: string,
  parentId?: string | null,
  isOfficialResponse?: boolean,
  sourceLink?: string | null,
  postType?: 'verified_insight' | 'community_experience',
  pillarOfTruth?: string | null,
  starRating?: number | null
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

  // Validate star rating if provided
  if (starRating !== undefined && starRating !== null) {
    if (!Number.isInteger(starRating) || starRating < 1 || starRating > 5) {
      return { success: false, error: "Star rating must be an integer between 1 and 5" };
    }
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
    // Ensure productId is a valid UUID string
    if (!productId || typeof productId !== 'string') {
      result = {
        success: false,
        error: "Invalid product ID"
      };
    } else {
      // Insert comment - handle both authenticated and guest users
      // Note: flag_count and is_flagged are handled below

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

          // Verify SME status if trying to mark as official response
          let canMarkOfficial = false;
          if (isOfficialResponse) {
            const profileResult = await sql`
              SELECT is_verified_expert, badge_type FROM profiles WHERE id = ${authorId}
            `;
            canMarkOfficial = profileResult[0]?.is_verified_expert || profileResult[0]?.badge_type === 'Trusted Voice';

            if (!canMarkOfficial) {
              return {
                success: false,
                error: "Only verified experts can mark responses as official"
              };
            }
          }

          // Auto-classify based on source link
          const finalPostType = postType || (sourceLink ? 'verified_insight' : 'community_experience');
          const finalPillar = finalPostType === 'verified_insight' ? pillarOfTruth : null;

          // Validate pillar requirement for verified insights
          if (finalPostType === 'verified_insight' && !finalPillar) {
            return {
              success: false,
              error: "Pillar of Truth is required for verified insights"
            };
          }

          // Prepare source metadata if link provided
          let sourceMetadata = null;
          if (sourceLink) {
            sourceMetadata = {
              url: sourceLink,
              addedAt: new Date().toISOString()
            };
          }

          console.log('Insert Data:', {
            product_id: productId,
            author_id: authorId,
            content: trimmedContent,
            flag_count: shouldAutoFlag ? 1 : 0,
            is_flagged: shouldAutoFlag,
            parent_id: parentId,
            is_official_response: isOfficialResponse && canMarkOfficial,
            post_type: finalPostType,
            pillar_of_truth: finalPillar,
            source_metadata: sourceMetadata,
            star_rating: starRating || null
          });

          try {
            // Insert comment using raw SQL
            const insertResult = await sql`
              INSERT INTO product_comments (
                product_id, author_id, content, flag_count, is_flagged, parent_id, is_official_response,
                post_type, pillar_of_truth, source_metadata, star_rating
              )
              VALUES (
                ${productId}, ${authorId}, ${trimmedContent},
                ${shouldAutoFlag ? 1 : 0}, ${shouldAutoFlag}, ${parentId || null}, ${isOfficialResponse && canMarkOfficial ? true : false},
                ${finalPostType}, ${finalPillar}, ${sourceMetadata ? JSON.stringify(sourceMetadata) : null}, ${starRating || null}
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
                  productId,
                  authorId,
                  undefined,
                  undefined,
                  new Date().toISOString()
                );
                console.log("Comment auto-flagged due to blacklisted keyword:", blacklistMatches[0].keyword);
              }

              // SME Insight Trigger (Gate A)
              // Process asynchronously (fire and forget pattern for speed)
              try {
                const profileResult = await sql`
                  SELECT is_verified_expert, contributor_score 
                  FROM profiles 
                  WHERE id = ${authorId}
                `;
                const profile = profileResult[0];
                const isSME = profile?.is_verified_expert || (profile?.contributor_score || 0) >= 100;

                if (isSME && trimmedContent.length >= 50) {
                  console.log("SME Product Comment detected, generating insight...");
                  const insight = await generateInsight(trimmedContent);
                  if (insight) {
                    await sql`
                      UPDATE product_comments
                      SET insight_summary = ${insight}
                      WHERE id = ${insertedComment.id}
                    `;
                    console.log("Insight saved for SME product comment");
                  }
                }
              } catch (err) {
                console.error("Error in SME insight generation:", err);
              }

              // Check for active SME Summons
              const summonsResult = await sql`
                SELECT id FROM sme_summons 
                WHERE product_id = ${productId} 
                  AND is_resolved = false 
                LIMIT 1
              `;

              const isSummoned = summonsResult.length > 0;
              let pointsAwarded = 5; // Base points for comment

              if (isSummoned) {
                pointsAwarded = 20; // Double points (assuming base 10 for "solving gap" or just bonus)
                // Mark summons as resolved
                await sql`
                  UPDATE sme_summons 
                  SET is_resolved = true 
                  WHERE id = ${summonsResult[0].id}
                `;
                console.log(`Summons resolved by ${authorId} for product ${productId}`);
              }

              // Award Reputation Points
              await sql`
                UPDATE profiles 
                SET contributor_score = COALESCE(contributor_score, 0) + ${pointsAwarded} 
                WHERE id = ${authorId}
              `;

              // --- AUTO-CITATION: Create citation entry when SME provides source link ---
              if (sourceLink && sourceLink.trim()) {
                try {
                  // Check if user is SME
                  const profileResult = await sql`
                    SELECT is_verified_expert, contributor_score 
                    FROM profiles 
                    WHERE id = ${authorId}
                  `;
                  const profile = profileResult[0];
                  const isSME = profile?.is_verified_expert || (profile?.contributor_score || 0) >= 100;

                  if (isSME) {
                    console.log("SME with source link detected - creating auto-citation");

                    // Extract title from URL or use a default
                    let citationTitle = sourceLink;
                    try {
                      const url = new URL(sourceLink);
                      citationTitle = url.hostname.replace('www.', '');

                      // Special handling for PubMed
                      if (sourceLink.includes('pubmed.ncbi.nlm.nih.gov')) {
                        const pmidMatch = sourceLink.match(/\/(\d+)\/?/);
                        if (pmidMatch) {
                          citationTitle = `PubMed: ${pmidMatch[1]}`;
                        }
                      }
                    } catch (urlError) {
                      console.error("Error parsing citation URL:", urlError);
                    }

                    // Insert into comment_references table
                    await sql`
                      INSERT INTO comment_references (
                        comment_id, resource_id, resource_title, resource_url
                      )
                      VALUES (
                        ${insertedComment.id}, 
                        ${insertedComment.id}, 
                        ${citationTitle}, 
                        ${sourceLink}
                      )
                    `;

                    console.log(`Auto-citation created for comment ${insertedComment.id}: ${citationTitle}`);
                  }
                } catch (citationError) {
                  console.error("Error creating auto-citation (table may not exist):", citationError);
                  // Don't fail the whole operation if citation creation fails
                }
              }

              // --- NOTIFICATION LOOP: Notify users who raised their hand if an Expert replies ---
              if (parentId) {
                try {
                  const profileResult = await sql`
                    SELECT is_verified_expert, badge_type FROM profiles WHERE id = ${String(user.id)}
                   `;
                  const isExpert = profileResult[0]?.is_verified_expert || profileResult[0]?.badge_type === 'Trusted Voice';

                  if (isExpert) {
                    console.log("Expert reply detected. Checking for signals on parent...");

                    // Get users who raised hand on the parent comment
                    const signalingUsers = await sql`
                       SELECT DISTINCT user_id 
                       FROM comment_signals 
                       WHERE product_comment_id = ${parentId} 
                       AND signal_type = 'raise_hand'
                       AND user_id != ${String(user.id)} 
                     `;

                    if (signalingUsers.length > 0) {
                      console.log(`Notifying ${signalingUsers.length} users who raised hand on parent ${parentId}`);

                      const notificationTitle = "Expert Reply";
                      const notificationMessage = "An expert has weighed in on a thread you signaled!";
                      const notificationLink = `/products/${productSlug}?commentId=${insertedComment.id}`;

                      // Send notifications in parallel
                      await Promise.all(signalingUsers.map((u: any) =>
                        createNotification(
                          u.user_id,
                          notificationTitle,
                          notificationMessage,
                          'success',
                          notificationLink
                        )
                      ));
                    }
                  }
                } catch (notifyError) {
                  console.error("Error in Notification Loop:", notifyError);
                }
              }

              // Update aggregate star rating if star rating was provided
              if (starRating) {
                try {
                  await sql`SELECT update_product_star_aggregate(${productId}::uuid)`;
                  console.log(`Updated aggregate star rating for product ${productId}`);
                } catch (aggregateError) {
                  console.error("Error updating aggregate star rating:", aggregateError);
                  // Don't fail the whole operation if aggregate update fails
                }
              }

              result = {
                success: true,
                commentId: insertedComment.id
              };
            }
          } catch (error: any) {
            console.error("Error creating comment:", error);
            console.error("Product ID:", productId);
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
    revalidatePath(`/products/${productSlug}`, "page");
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
  productId: string,
  content: string,
  guestName: string,
  productSlug: string,
  starRating?: number | null
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

  // Validate star rating if provided
  if (starRating !== undefined && starRating !== null) {
    if (!Number.isInteger(starRating) || starRating < 1 || starRating > 5) {
      return { success: false, error: "Star rating must be an integer between 1 and 5" };
    }
  }

  // Guest users require AI moderation via checkVibeForGuest (context-aware)
  const vibeResult = await checkVibeForGuest(trimmedContent);
  if (!vibeResult.isSafe) {
    return {
      success: false,
      error: "Content rejected by laboratory AI."
    };
  }

  // Determine status based on confidence
  // Low confidence = borderline case, send to pending_review for admin approval
  const commentStatus = vibeResult.confidence === 'low' ? 'pending_review' : 'approved';

  try {
    // Insert guest comment using raw SQL
    const result = await sql`
      INSERT INTO product_comments (
        product_id, author_id, guest_name, content, flag_count, is_flagged, status, star_rating
      )
      VALUES (
        ${productId}, NULL, ${trimmedGuestName}, ${trimmedContent}, 0, false, ${commentStatus}, ${starRating || null}
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

    // Update aggregate star rating if star rating was provided
    if (starRating) {
      try {
        await sql`SELECT update_product_star_aggregate(${productId}::uuid)`;
        console.log(`Updated aggregate star rating for product ${productId}`);
      } catch (aggregateError) {
        console.error("Error updating aggregate star rating:", aggregateError);
        // Don't fail the whole operation if aggregate update fails
      }
    }

    // Revalidate paths
    revalidatePath(`/products/${productSlug}`, "page");
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
        UPDATE products
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
        INSERT INTO products (
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
      INSERT INTO products (
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
            UPDATE products
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


/**
 * Search products for Swap Specimen Modal
 */
export async function searchProducts(query: string, limit = 20) {
  const sql = getDb();
  let products;

  try {
    if (query.trim()) {
      products = await sql`
        SELECT id, title, problem_solved, images
        FROM products
        WHERE (title ILIKE ${`%${query}%`} OR problem_solved ILIKE ${`%${query}%`})
        ORDER BY title ASC
        LIMIT ${limit}
      `;
    } else {
      products = await sql`
        SELECT id, title, problem_solved, images
        FROM products
        ORDER BY title ASC
        LIMIT ${limit}
      `;
    }
    return products;
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}
