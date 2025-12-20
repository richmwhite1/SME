import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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
  // Fetch current profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, username, bio, credentials, profession, website_url, social_links")
    .eq("id", user.id)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error);
  }
  // Get social handles from Clerk publicMetadata (fallback to database)
  const clerkXHandle = (user.publicMetadata?.xHandle as string) || null;
  const clerkTelegramHandle = (user.publicMetadata?.telegramHandle as string) || null;
  const clerkDiscordHandle = (user.publicMetadata?.discordHandle as string) || null;
  const clerkInstagramHandle = (user.publicMetadata?.instagramHandle as string) || null;
  const currentProfile = profile || {
    full_name: user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.emailAddresses[0]?.emailAddress || "",
    username: null,
    bio: null,
    credentials: null,
    profession: null,
    website_url: null,
    social_links: {
      x: clerkXHandle,
      telegram: clerkTelegramHandle,
      discord: clerkDiscordHandle,
      instagram: clerkInstagramHandle,
    },
  };
  // Merge Clerk metadata with database social_links (Clerk takes precedence)
  if (currentProfile.social_links) {
    if (clerkXHandle) {
      currentProfile.social_links.x = clerkXHandle;
    }
    if (clerkTelegramHandle) {
      currentProfile.social_links.telegram = clerkTelegramHandle;
    }
    if (clerkDiscordHandle) {
      currentProfile.social_links.discord = clerkDiscordHandle;
    }
    if (clerkInstagramHandle) {
      currentProfile.social_links.instagram = clerkInstagramHandle;
    }
  }
  // Check if user is admin
  const adminStatus = await isAdmin();
  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 font-serif text-4xl font-bold text-bone-white">Settings</h1>
        
        <ProfileSettingsForm initialProfile={currentProfile} />
        {/* Debug Section - Only visible to admins */}
        {adminStatus && (
          <div className="mt-8 border border-translucent-emerald bg-muted-moss p-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-bone-white">Debug Tools</h2>
            <p className="mb-4 text-sm text-bone-white/70 font-mono">
              Admin-only tools for testing and debugging
            </p>
            <BadgeDebugButton />
          </div>
        )}
      </div>
    </main>
  );
}
