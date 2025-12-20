"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Store evidence document URL in database
 * Note: Document storage should be handled via a separate service or S3-compatible storage
 * This function now accepts a pre-uploaded document URL
 */
async function storeEvidenceDocumentUrl(
  fileName: string,
  documentUrl: string
): Promise<{ url: string; path: string }> {
  const filePath = `evidence/${fileName}`;

  return { url: documentUrl, path: filePath };
}

/**
 * Submit lab evidence (COA or Lab Report) for a product
 */
export async function submitLabEvidence(
  productId: string,
  labName: string,
  batchNumber: string,
  documentBase64: string,
  documentFileName: string,
  documentContentType: string,
  isConfirmed: boolean
) {
  const user = await currentUser();
  if (!user) {
    throw new Error("You must be logged in to submit evidence");
  }

  if (!isConfirmed) {
    throw new Error("You must confirm that the document is a genuine COA or Lab Report");
  }

  if (!labName || !batchNumber || !documentBase64) {
    throw new Error("Lab name, batch number, and document are required");
  }

  // Validate file type (PDF or Image)
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
  if (!allowedTypes.includes(documentContentType)) {
    throw new Error("Document must be a PDF or image file (JPEG, PNG, or WebP)");
  }

  try {
    // For now, accept a document URL that should be provided by the client
    // In a production setup, you would upload to S3 or similar before this step
    // This creates a placeholder - the actual document storage should be configured separately
    const documentUrl = `https://placeholder-storage/${documentFileName}`;

    const sql = getDb();

    // Insert evidence submission into database using raw SQL
    const result = await sql`
      INSERT INTO evidence_submissions (
        product_id,
        submitted_by,
        lab_name,
        batch_number,
        document_url,
        document_type,
        status,
        is_confirmed,
        created_at,
        updated_at
      )
      VALUES (
        ${productId},
        ${user.id},
        ${labName.trim()},
        ${batchNumber.trim()},
        ${documentUrl},
        ${documentContentType.startsWith("application/pdf") ? "pdf" : "image"},
        'pending',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, product_id, submitted_by, lab_name, batch_number, document_url, status, created_at
    `;

    if (!result || result.length === 0) {
      throw new Error(
        "Evidence submissions table not found. Please ensure the evidence_submissions table exists in your database."
      );
    }

    const submission = result[0];

    // Revalidate product page
    revalidatePath(`/products/${productId}`, "page");
    revalidatePath("/resources", "page");

    return { success: true, submissionId: submission.id };
  } catch (err) {
    console.error("Error in submitLabEvidence:", err);
    throw err;
  }
}



