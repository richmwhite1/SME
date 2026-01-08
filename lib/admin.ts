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

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, role: 'standard' | 'sme' | 'sme_admin' | 'admin' | 'business_user'): Promise<boolean> {
  try {
    const sql = getDb();

    const result = await sql`
      SELECT user_role
      FROM profiles
      WHERE id = ${userId}
    `;

    const profile = result[0];

    if (!profile) {
      return false;
    }

    return profile.user_role === role;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Check if a user has a role at or above a certain level
 * Role hierarchy: standard < business_user < sme < sme_admin < admin
 */
export async function hasRoleOrHigher(userId: string, requiredRole: 'standard' | 'sme' | 'sme_admin' | 'admin' | 'business_user'): Promise<boolean> {
  try {
    const sql = getDb();

    const result = await sql`
      SELECT user_role
      FROM profiles
      WHERE id = ${userId}
    `;

    const profile = result[0];

    if (!profile) {
      return false;
    }

    const roleHierarchy = ['standard', 'business_user', 'sme', 'sme_admin', 'admin'];
    const userRoleLevel = roleHierarchy.indexOf(profile.user_role || 'standard');
    const requiredRoleLevel = roleHierarchy.indexOf(requiredRole);

    return userRoleLevel >= requiredRoleLevel;
  } catch (error) {
    console.error("Error checking role hierarchy:", error);
    return false;
  }
}

/**
 * Check if the current user can perform SME verification
 * Returns true if user is SME Admin or Admin
 */
export async function canPerformSMEVerification(): Promise<boolean> {
  try {
    const user = await currentUser();

    if (!user) {
      return false;
    }

    const sql = getDb();

    const result = await sql`
      SELECT user_role, is_verified_expert, is_admin
      FROM profiles
      WHERE id = ${user.id}
    `;

    const profile = result[0];

    if (!profile) {
      return false;
    }

    // Check new role system first, fall back to old boolean flags
    if (profile.user_role === 'sme_admin' || profile.user_role === 'admin') {
      return true;
    }

    // Backward compatibility with old system
    return profile.is_verified_expert === true || profile.is_admin === true;
  } catch (error) {
    console.error("Error checking SME verification permission:", error);
    return false;
  }
}

