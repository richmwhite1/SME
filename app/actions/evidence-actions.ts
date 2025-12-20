"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Upload evidence document (COA or Lab Report) to Supabase Storage
 */
async function uploadEvidenceDocument(
  base64Data: string,
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase service role key. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables."
    );
  }

  // Create Supabase client with service role key
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Convert base64 to buffer
  const base64String = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;
  const buffer = Buffer.from(base64String, "base64");

  const filePath = `evidence/${fileName}`;

  // Upload to Supabase storage (use evidence bucket or product-images bucket)
  const bucketName = "product-images"; // Reuse existing bucket or create 'evidence' bucket
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType: contentType,
      upsert: false,
    });

  if (error) {
    console.error("Error uploading evidence document:", error);
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
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
    // Upload document to storage
    const { url: documentUrl } = await uploadEvidenceDocument(
      documentBase64,
      documentFileName,
      documentContentType
    );

    const supabase = createClient();

    // Insert evidence submission into database
    // First, check if evidence_submissions table exists, if not we'll create it via SQL
    const { data: submission, error } = await (supabase as any)
      .from("evidence_submissions")
      .insert({
        product_id: productId,
        submitted_by: user.id,
        lab_name: labName.trim(),
        batch_number: batchNumber.trim(),
        document_url: documentUrl,
        document_type: documentContentType.startsWith("application/pdf") ? "pdf" : "image",
        status: "pending", // pending, verified, rejected
        is_confirmed: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting evidence:", error);
      // Check if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        throw new Error(
          "Evidence submissions table not found. Please run the SQL migration: supabase-evidence-submissions.sql in your Supabase SQL Editor."
        );
      }
      throw new Error(`Failed to submit evidence: ${error.message}`);
    }

    // Revalidate product page
    revalidatePath(`/products/${productId}`, "page");
    revalidatePath("/resources", "page");

    return { success: true, submissionId: submission?.id };
  } catch (err) {
    console.error("Error in submitLabEvidence:", err);
    throw err;
  }
}



