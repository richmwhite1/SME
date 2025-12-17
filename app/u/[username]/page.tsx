import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Edit, Instagram, MessageCircle, Twitter } from "lucide-react";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";
import ProfileActivity from "@/components/profile/ProfileActivity";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  credentials: string | null;
  website_url: string | null;
  avatar_url: string | null;
  contributor_score: number;
  email: string | null;
  social_links: {
    discord?: string | null;
    telegram?: string | null;
    x?: string | null;
    instagram?: string | null;
  } | null;
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = createClient();
  
  // Fetch current user from Clerk
  const clerkUser = await currentUser();
  const currentUserId = clerkUser?.id || null;

  // Fetch profile by username from Supabase
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, bio, credentials, website_url, avatar_url, contributor_score, email, social_links")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !profile) {
    notFound();
  }

  // @ts-ignore - Profile type may not match exactly due to optional credentials
  const typedProfile = profile as Profile;
  
  // Determine if current user is the profile owner
  const isOwner = clerkUser?.id === typedProfile.id;

  // Fetch follower/following counts
  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", typedProfile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", typedProfile.id);

  // Check if current user is following this profile (only if not owner)
  let isFollowing = false;
  if (currentUserId && !isOwner) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", typedProfile.id)
      .maybeSingle();

    isFollowing = !!follow;
  }

  // Calculate total upvotes received (only if owner viewing their own profile)
  let totalUpvotes = 0;
  if (isOwner) {
    // Get all review IDs authored by this user
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", typedProfile.id);

    const reviewIds = reviews?.map(r => r.id) || [];
    
    // Count helpful votes on those reviews
    if (reviewIds.length > 0) {
      const { count: reviewVotesCount } = await supabase
        .from("helpful_votes")
        .select("id", { count: "exact", head: true })
        .in("review_id", reviewIds);
      
      totalUpvotes += reviewVotesCount || 0;
    }

    // Get all discussion IDs authored by this user
    const { data: discussions } = await supabase
      .from("discussions")
      .select("id")
      .eq("author_id", typedProfile.id);

    const discussionIds = discussions?.map(d => d.id) || [];
    
    // Count discussion votes on those discussions
    if (discussionIds.length > 0) {
      const { count: discussionVotesCount } = await supabase
        .from("discussion_votes")
        .select("id", { count: "exact", head: true })
        .in("discussion_id", discussionIds);
      
      totalUpvotes += discussionVotesCount || 0;
    }
  }

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Profile Header - Always shows public view */}
        <div className="mb-8 rounded-xl bg-white/50 p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {typedProfile.avatar_url ? (
                <Image
                  src={typedProfile.avatar_url}
                  alt={typedProfile.full_name || "User"}
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] rounded-full object-cover"
                />
              ) : (
                <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-soft-clay text-4xl font-semibold text-deep-stone">
                  {typedProfile.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-deep-stone">
                    {typedProfile.full_name || "Anonymous User"}
                  </h1>
                  {typedProfile.credentials && (
                    <span className="rounded-full bg-earth-green/20 px-3 py-1 text-sm font-medium text-earth-green">
                      {typedProfile.credentials}
                    </span>
                  )}
                  {typedProfile.contributor_score > 10 && (
                    <span className="rounded-full bg-earth-green/20 px-3 py-1 text-sm font-medium text-earth-green">
                      Trusted Contributor
                    </span>
                  )}
                </div>
                <p className="text-lg text-deep-stone/70">@{username}</p>
              </div>

              {/* Bio */}
              {typedProfile.bio && (
                <p className="mb-4 leading-relaxed text-deep-stone/80">
                  {typedProfile.bio}
                </p>
              )}

              {/* Website Link */}
              {typedProfile.website_url && (
                <div className="mb-4">
                  <a
                    href={typedProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-earth-green hover:underline"
                  >
                    🔗 {typedProfile.website_url}
                  </a>
                </div>
              )}

              {/* Social Media Links */}
              {typedProfile.social_links && (
                <div className="mb-4 flex flex-wrap gap-3">
                  {typedProfile.social_links.discord && (
                    <a
                      href={
                        typedProfile.social_links.discord.startsWith("http")
                          ? typedProfile.social_links.discord
                          : `https://discord.com/users/${typedProfile.social_links.discord}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-deep-stone transition-all duration-300 hover:bg-earth-green/10 hover:text-earth-green"
                      title="Discord"
                    >
                      <MessageCircle size={16} />
                      <span>Discord</span>
                    </a>
                  )}
                  {typedProfile.social_links.telegram && (
                    <a
                      href={`https://t.me/${typedProfile.social_links.telegram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-deep-stone transition-all duration-300 hover:bg-earth-green/10 hover:text-earth-green"
                      title="Telegram"
                    >
                      <MessageCircle size={16} />
                      <span>Telegram</span>
                    </a>
                  )}
                  {typedProfile.social_links.x && (
                    <a
                      href={`https://x.com/${typedProfile.social_links.x.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-deep-stone transition-all duration-300 hover:bg-earth-green/10 hover:text-earth-green"
                      title="X (Twitter)"
                    >
                      <Twitter size={16} />
                      <span>X</span>
                    </a>
                  )}
                  {typedProfile.social_links.instagram && (
                    <a
                      href={`https://instagram.com/${typedProfile.social_links.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-deep-stone transition-all duration-300 hover:bg-earth-green/10 hover:text-earth-green"
                      title="Instagram"
                    >
                      <Instagram size={16} />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="mb-4 flex gap-6">
                <div>
                  <span className="font-semibold text-deep-stone">{followerCount || 0}</span>
                  <span className="ml-1 text-deep-stone/60">Followers</span>
                </div>
                <div>
                  <span className="font-semibold text-deep-stone">{followingCount || 0}</span>
                  <span className="ml-1 text-deep-stone/60">Following</span>
                </div>
                <div>
                  <span className="font-semibold text-earth-green">
                    {typedProfile.contributor_score || 0}
                  </span>
                  <span className="ml-1 text-deep-stone/60">Contributor Score</span>
                </div>
              </div>

              {/* Badge Progress - Only visible to profile owner */}
              {isOwner && (
                <div className="mb-4 rounded-lg border border-earth-green/20 bg-earth-green/5 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-deep-stone">Badge Progress</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-deep-stone/70">Contributor Score:</span>
                      <span className="font-semibold text-deep-stone">
                        {typedProfile.contributor_score || 0} / 50
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-deep-stone/70">Total Upvotes Received:</span>
                      <span className="font-semibold text-deep-stone">
                        {totalUpvotes} / 10
                      </span>
                    </div>
                    <div className="mt-3 rounded bg-white/50 p-2 text-xs text-deep-stone/70">
                      <strong>Requirement:</strong> Need 50 Contributor Score & 10 Upvotes for Trusted Voice status
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button - Public view for everyone */}
              {isOwner ? (
                // Owner: Show Edit Profile button (redirects to /settings)
                <Link href="/settings">
                  <Button variant="primary" className="flex items-center gap-2">
                    <Edit size={16} />
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                // Public Viewer: Show Follow button (or Sign in prompt for guests)
                <ProfileFollowButton
                  targetUserId={typedProfile.id}
                  isFollowing={isFollowing}
                />
              )}
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <ProfileActivity userId={typedProfile.id} />
      </div>
    </main>
  );
}

