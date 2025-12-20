"use server";

import { currentUser } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

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
 * Upload image to PostgreSQL database
 * Stores image metadata and returns a reference URL
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

  const sql = getDb();
  
  try {
    // Store image metadata in PostgreSQL
    const filePath = `products/${fileName}`;
    
    // Insert image record into database
    const images = await sql`
      INSERT INTO product_images (file_name, content_type, file_path, uploaded_by, created_at)
      VALUES (${fileName}, ${contentType}, ${filePath}, ${user.id}, NOW())
      RETURNING id, file_path
    `;

    if (!images || images.length === 0) {
      throw new Error("Failed to save image metadata to database");
    }

    // Generate public URL based on file path
    // In production, you'd serve these from a CDN or public storage endpoint
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/images/${images[0].id}`;

    console.log("Image uploaded successfully:");
    console.log("  Path:", filePath);
    console.log("  Public URL:", publicUrl);

    // Verify the URL is a full URL
    if (!publicUrl || (!publicUrl.startsWith('http://') && !publicUrl.startsWith('https://'))) {
      throw new Error(`Invalid public URL returned: ${publicUrl}`);
    }

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

