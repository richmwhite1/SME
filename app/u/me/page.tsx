import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface UserProfile {
  username: string | null;
}

/**
 * /u/me Redirect Route
 * 
 * This route redirects to the current user's profile page.
 * It fetches the user's username from Postgres and redirects to /u/[username].
 * If the user doesn't have a username set, redirects to /settings to set one up.
 */
export default async function MyProfileRedirect() {
  // Get current user from Clerk
  const user = await currentUser();
  if (!user) {
    // Not logged in - redirect to home
    redirect("/");
  }

  const sql = getDb();
  let profile: UserProfile | null = null;

  try {
    // Fetch user's username from profiles table
    const result = await sql`
      SELECT username
      FROM profiles
      WHERE id = ${user.id}
      LIMIT 1
    `;

    if (result && result.length > 0) {
      profile = result[0] as UserProfile;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    redirect("/settings");
  }

  if (!profile || !profile.username) {
    // User doesn't have a username set yet - redirect to settings
    redirect("/settings");
  }

  // Redirect to the user's actual profile (Owner View)
  redirect(`/u/${profile.username.toLowerCase()}`);
}
