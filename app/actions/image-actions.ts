"use server";

import { currentUser } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";

/**
 * Verify admin status for image upload
 * Returns true if user is admin
 */
export async function verifyAdminForUpload(): Promise<boolean> {
  const user = await currentUser();
  if (!user) {
    return false;
  }

  return await isAdmin();
}

/**
 * Upload image to Supabase Storage using service role
 * This bypasses RLS since we're using Clerk for auth
 * Accepts base64 string instead of File object (for server action compatibility)
 */
export async function uploadProductImage(
  base64Data: string,
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const user = await currentUser();
  if (!user) {
    throw new Error("You must be logged in to upload images");
  }

  // Verify admin status
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can upload product images");
  }

  // Use service role key for uploads (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase service role key. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables."
    );
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Convert base64 to buffer
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64String = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;
  const buffer = Buffer.from(base64String, "base64");

  const filePath = `products/${fileName}`;

  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(filePath, buffer, {
      contentType: contentType,
      upsert: false,
    });

  if (error) {
    console.error("Error uploading image:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL - this returns the full public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(filePath);

  console.log("Image uploaded successfully:");
  console.log("  Path:", filePath);
  console.log("  Public URL:", publicUrl);

  // Verify the URL is a full URL
  if (!publicUrl || (!publicUrl.startsWith('http://') && !publicUrl.startsWith('https://'))) {
    throw new Error(`Invalid public URL returned: ${publicUrl}`);
  }

  return {
    url: publicUrl, // Full public URL, e.g., https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/products/[filename]
    path: filePath,
  };
}

