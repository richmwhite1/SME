"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkUserBanned } from "@/lib/trust-safety";
import { isAdmin } from "@/lib/admin";

/**
 * Submit brand certification application
 */
export async function submitBrandApplication(
  businessName: string,
  email: string,
  productInterest?: string
) {
  const user = await currentUser();
  const sql = getDb();

  // Check if user is banned
  if (user) {
    const isBanned = await checkUserBanned(user.id);
    if (isBanned) {
      throw new Error("Your laboratory access has been restricted");
    }
  }

  // Validate inputs
  const trimmedBusinessName = businessName.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedProductInterest = productInterest?.trim() || null;

  if (!trimmedBusinessName || trimmedBusinessName.length < 2) {
    throw new Error("Business name must be at least 2 characters");
  }

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Valid email address is required");
  }

  try {
    // Insert application using raw PostgreSQL
    await sql`
      INSERT INTO brand_applications (business_name, email, product_interest, status)
      VALUES (${trimmedBusinessName}, ${trimmedEmail}, ${trimmedProductInterest}, 'pending')
    `;
  } catch (error) {
    console.error("Error submitting brand application:", error);
    throw new Error(`Failed to submit application: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Submit contact form
 */
export async function submitContactForm(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  const user = await currentUser();
  const sql = getDb();

  // Check if user is banned
  if (user) {
    const isBanned = await checkUserBanned(user.id);
    if (isBanned) {
      throw new Error("Your laboratory access has been restricted");
    }
  }

  // Validate inputs
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedSubject = subject.trim() || null;
  const trimmedMessage = message.trim();

  if (!trimmedName || trimmedName.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Valid email address is required");
  }

  if (!trimmedMessage || trimmedMessage.length < 10) {
    throw new Error("Message must be at least 10 characters");
  }

  try {
    // Insert submission using raw PostgreSQL
    await sql`
      INSERT INTO contact_submissions (name, email, subject, message, status)
      VALUES (${trimmedName}, ${trimmedEmail}, ${trimmedSubject}, ${trimmedMessage}, 'new')
    `;
  } catch (error) {
    console.error("Error submitting contact form:", error);
    throw new Error(`Failed to submit message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Submit product intake application
 */
export async function submitProductIntake(
  productName: string,
  description: string,
  tier: "standard" | "featured",
  wantsCertification: boolean,
  email: string,
  purityDocUrl?: string,
  purityDocFilename?: string
) {
  const user = await currentUser();
  const sql = getDb();

  // Check if user is banned
  if (user) {
    const isBanned = await checkUserBanned(user.id);
    if (isBanned) {
      throw new Error("Your laboratory access has been restricted");
    }
  }

  // Validate inputs
  const trimmedProductName = productName.trim();
  const trimmedDescription = description.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedProductName || trimmedProductName.length < 2) {
    throw new Error("Product name must be at least 2 characters");
  }

  if (!trimmedDescription || trimmedDescription.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Valid email address is required");
  }

  if (wantsCertification && !purityDocUrl) {
    throw new Error("Purity test documentation is required for certification");
  }

  try {
    // Insert submission using raw PostgreSQL
    await sql`
      INSERT INTO product_intake (
        product_name, description, tier, wants_certification, 
        purity_doc_url, purity_doc_filename, submitted_by, 
        submitted_email, status
      )
      VALUES (
        ${trimmedProductName}, ${trimmedDescription}, ${tier}, ${wantsCertification},
        ${purityDocUrl || null}, ${purityDocFilename || null}, ${user?.id || null},
        ${trimmedEmail}, 'pending'
      )
    `;
  } catch (error) {
    console.error("Error submitting product intake:", error);
    throw new Error(`Failed to submit product: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Get all contact submissions
 * Admin only
 */
export async function getContactSubmissions() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can view contact submissions");
  }

  const sql = getDb();
  try {
    const data = await sql`
      SELECT * FROM contact_submissions 
      ORDER BY created_at DESC
    `;
    return data;
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    throw new Error(`Failed to fetch submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all brand applications
 * Admin only
 */
export async function getBrandApplications() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can view brand applications");
  }

  const sql = getDb();
  try {
    const data = await sql`
      SELECT * FROM brand_applications 
      ORDER BY created_at DESC
    `;
    return data;
  } catch (error) {
    console.error("Error fetching brand applications:", error);
    throw new Error(`Failed to fetch applications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all product intake submissions
 * Admin only
 */
export async function getProductIntakeSubmissions() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can view product intake");
  }

  const sql = getDb();
  try {
    const data = await sql`
      SELECT * FROM product_intake 
      ORDER BY created_at DESC
    `;
    return data;
  } catch (error) {
    console.error("Error fetching product intake:", error);
    throw new Error(`Failed to fetch submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update contact submission status
 * Admin only
 */
export async function updateContactStatus(submissionId: string, status: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can update contact status");
  }

  const sql = getDb();
  try {
    await sql`
      UPDATE contact_submissions 
      SET status = ${status}, updated_at = ${new Date().toISOString()}
      WHERE id = ${submissionId}
    `;
  } catch (error) {
    console.error("Error updating contact status:", error);
    throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Update brand application status
 * Admin only
 */
export async function updateBrandApplicationStatus(applicationId: string, status: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can update application status");
  }

  const sql = getDb();
  try {
    await sql`
      UPDATE brand_applications 
      SET status = ${status}, updated_at = ${new Date().toISOString()}
      WHERE id = ${applicationId}
    `;
  } catch (error) {
    console.error("Error updating brand application status:", error);
    throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Update product intake status
 * Admin only
 */
export async function updateProductIntakeStatus(submissionId: string, status: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can update product intake status");
  }

  const sql = getDb();
  try {
    await sql`
      UPDATE product_intake 
      SET status = ${status}, updated_at = ${new Date().toISOString()}
      WHERE id = ${submissionId}
    `;
  } catch (error) {
    console.error("Error updating product intake status:", error);
    throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  revalidatePath("/admin");
  return { success: true };
}