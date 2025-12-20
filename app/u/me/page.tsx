import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface UserProfile {
  username: string | null;
}

/**
 * /u/me Redirect Route
 * 
 * This route redirects to the current user's profile page.
 * It fetches the user's username from Supabase and redirects to /u/[username].
 * If the user doesn't have a username set, redirects to /settings to set one up.
 */
export default async function MyProfileRedirect() {
  // Get current user from Clerk
  const user = await currentUser();

  if (!user) {
    // Not logged in - redirect to home
    redirect("/");
  }

  const supabase = createClient();

  // Fetch user's username from Supabase profiles table
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle() as { data: UserProfile | null, error: any };

  if (error) {
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

