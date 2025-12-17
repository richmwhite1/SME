import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";
import BadgeDebugButton from "@/components/settings/BadgeDebugButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Protect route: Check if user is authenticated
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  const supabase = createClient();

  // Fetch current profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, username, bio, credentials, website_url, social_links")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error);
  }

  const currentProfile = profile || {
    full_name: user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.emailAddresses[0]?.emailAddress || "",
    username: null,
    bio: null,
    credentials: null,
    website_url: null,
    social_links: {},
  };

  // Check if user is admin
  const adminStatus = await isAdmin();

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-4xl font-bold text-deep-stone">Settings</h1>
        
        <ProfileSettingsForm initialProfile={currentProfile} />

        {/* Debug Section - Only visible to admins */}
        {adminStatus && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-deep-stone">Debug Tools</h2>
            <p className="mb-4 text-sm text-deep-stone/70">
              Admin-only tools for testing and debugging
            </p>
            <BadgeDebugButton />
          </div>
        )}
      </div>
    </main>
  );
}

