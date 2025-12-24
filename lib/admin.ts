import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

/**
 * Checks if the current user has admin role
 * Returns true if user is admin, false otherwise
 * Checks both Clerk publicMetadata.role and profile.is_admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await currentUser();

    if (!user) {
      return false;
    }

    // Check Clerk publicMetadata.role first
    const clerkRole = (user.publicMetadata?.role as string) || null;
    if (clerkRole === "admin") {
      return true;
    }

    const sql = getDb();

    // Check if user has admin role in profiles table
    const result = await sql`
      SELECT is_admin
      FROM profiles
      WHERE id = ${user.id}
    `;

    const profile = result[0];

    if (!profile) {
      console.error("Profile not found for admin status check");
      return false;
    }

    return profile.is_admin === true;
  } catch (error) {
    console.error("Error in isAdmin check:", error);
    return false;
  }
}

/**
 * Gets the current user's ID if they are authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await currentUser();
    return user?.id || null;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

