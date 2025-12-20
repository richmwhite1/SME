import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Edit, Instagram, MessageCircle, Twitter } from "lucide-react";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";
import ProfileActivity from "@/components/profile/ProfileActivity";
import EditProfileButton from "@/components/profile/EditProfileButton";
import Button from "@/components/ui/Button";
import TrustWeight from "@/components/ui/TrustWeight";

export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  credentials: string | null;
  profession: string | null;
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
    .select("id, full_name, username, bio, credentials, profession, website_url, avatar_url, contributor_score, email, social_links, badge_type")
    .eq("username", username.toLowerCase())
    .single();

  // If viewing own profile, get social handles from Clerk publicMetadata
  let clerkXHandle: string | null = null;
  let clerkTelegramHandle: string | null = null;
  let clerkDiscordHandle: string | null = null;
  let clerkInstagramHandle: string | null = null;
  const profileId = profile ? (profile as { id: string }).id : null;
  if (profileId && clerkUser && profileId === clerkUser.id) {
    clerkXHandle = (clerkUser.publicMetadata?.xHandle as string) || null;
    clerkTelegramHandle = (clerkUser.publicMetadata?.telegramHandle as string) || null;
    clerkDiscordHandle = (clerkUser.publicMetadata?.discordHandle as string) || null;
    clerkInstagramHandle = (clerkUser.publicMetadata?.instagramHandle as string) || null;
  }
  
  // Count verified citations for this user
  let verifiedCitations = 0;
  if (profile) {
    // Get all comments by this user
    const { data: userComments } = await supabase
      .from("discussion_comments")
      .select("id")
      // @ts-ignore - Supabase type inference issue with .eq()
      .eq("author_id", profile.id);
    
    if (userComments && Array.isArray(userComments) && userComments.length > 0) {
      // Type assertion for Supabase query result
      const typedComments = userComments as Array<{ id: string }>;
      const commentIds = typedComments.map(c => c.id);
      if (commentIds.length > 0) {
        const { count: citationCount } = await supabase
          .from("comment_references")
          .select("*", { count: "exact", head: true })
          .in("comment_id", commentIds);
        verifiedCitations = citationCount || 0;
      }
    }
  }

  if (error || !profile) {
    notFound();
  }

  // @ts-ignore - Profile type may not match exactly due to optional credentials
  const typedProfile = profile as Profile;
  
  // Merge Clerk metadata with database social_links (Clerk takes precedence)
  if (typedProfile.social_links) {
    if (clerkXHandle) {
      typedProfile.social_links.x = clerkXHandle;
    }
    if (clerkTelegramHandle) {
      typedProfile.social_links.telegram = clerkTelegramHandle;
    }
    if (clerkDiscordHandle) {
      typedProfile.social_links.discord = clerkDiscordHandle;
    }
    if (clerkInstagramHandle) {
      typedProfile.social_links.instagram = clerkInstagramHandle;
    }
  } else {
    typedProfile.social_links = {
      x: clerkXHandle,
      telegram: clerkTelegramHandle,
      discord: clerkDiscordHandle,
      instagram: clerkInstagramHandle,
    };
  }
  
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

    const reviewIds = (reviews || []).map((r: { id: string }) => r.id);
    
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

    const discussionIds = (discussions || []).map((d: { id: string }) => d.id);
    
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
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Profile Header */}
        <div className="mb-8 border border-translucent-emerald bg-muted-moss p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {typedProfile.avatar_url ? (
                <Image
                  src={typedProfile.avatar_url}
                  alt={typedProfile.full_name || "User"}
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] rounded-full object-cover border border-translucent-emerald"
                />
              ) : (
                <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-forest-obsidian border border-translucent-emerald text-4xl font-semibold text-bone-white">
                  {typedProfile.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-3">
                  <h1 className="font-serif text-3xl font-bold text-bone-white">
                    {typedProfile.full_name || "Anonymous User"}
                  </h1>
                  {typedProfile.credentials && (
                    <span className="border border-sme-gold/30 bg-sme-gold/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-sme-gold">
                      {typedProfile.credentials}
                    </span>
                  )}
                  {typedProfile.contributor_score > 10 && (
                    <span className="border border-heart-green/30 bg-heart-green/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-heart-green">
                      Trusted Contributor
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-bone-white/70 font-mono">@{username}</p>
                  {typedProfile.profession && (
                    <span className="text-sm text-bone-white/60 font-mono">
                      • {typedProfile.profession}
                    </span>
                  )}
                  {typedProfile.contributor_score && typedProfile.contributor_score > 0 && (
                    <TrustWeight
                      value={typedProfile.contributor_score}
                      verifiedCitations={verifiedCitations}
                    />
                  )}
                </div>
              </div>

              {/* Bio */}
              {typedProfile.bio && (
                <p className="mb-4 leading-relaxed text-bone-white/80 font-mono">
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
                    className="text-xs text-heart-green hover:underline font-mono"
                  >
                    🔗 {typedProfile.website_url}
                  </a>
                </div>
              )}

              {/* Social Media Links */}
              {typedProfile.social_links && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {typedProfile.social_links.discord && (
                    <a
                      href={
                        typedProfile.social_links.discord.startsWith("http")
                          ? typedProfile.social_links.discord
                          : `https://discord.com/users/${typedProfile.social_links.discord}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-translucent-emerald bg-forest-obsidian px-2 py-1 text-xs text-bone-white/70 hover:text-bone-white hover:border-heart-green transition-all font-mono"
                      title="Discord"
                    >
                      <MessageCircle size={12} />
                      <span>Discord</span>
                    </a>
                  )}
                  {typedProfile.social_links.telegram && (
                    <a
                      href={`https://t.me/${typedProfile.social_links.telegram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-translucent-emerald bg-forest-obsidian px-2 py-1 text-xs text-bone-white/70 hover:text-bone-white hover:border-heart-green transition-all font-mono"
                      title="Telegram"
                    >
                      <MessageCircle size={12} />
                      <span>Telegram</span>
                    </a>
                  )}
                  {typedProfile.social_links.x && (
                    <a
                      href={`https://x.com/${typedProfile.social_links.x.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-translucent-emerald bg-forest-obsidian px-2 py-1 text-xs text-bone-white/70 hover:text-bone-white hover:border-heart-green transition-all font-mono"
                      title="X (Twitter)"
                    >
                      <Twitter size={12} />
                      <span>X</span>
                    </a>
                  )}
                  {typedProfile.social_links.instagram && (
                    <a
                      href={`https://instagram.com/${typedProfile.social_links.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-translucent-emerald bg-forest-obsidian px-2 py-1 text-xs text-bone-white/70 hover:text-bone-white hover:border-heart-green transition-all font-mono"
                      title="Instagram"
                    >
                      <Instagram size={12} />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="mb-4 flex gap-6 text-xs font-mono">
                <div>
                  <span className="font-semibold text-bone-white">{followerCount || 0}</span>
                  <span className="ml-1 text-bone-white/60 uppercase tracking-wider">Followers</span>
                </div>
                <div>
                  <span className="font-semibold text-bone-white">{followingCount || 0}</span>
                  <span className="ml-1 text-bone-white/60 uppercase tracking-wider">Following</span>
                </div>
                <div>
                  <span className="font-semibold text-heart-green">
                    {typedProfile.contributor_score || 0}
                  </span>
                  <span className="ml-1 text-bone-white/60 uppercase tracking-wider">Contributor Score</span>
                </div>
              </div>

              {/* Badge Progress - Only visible to profile owner */}
              {isOwner && (
                <div className="mb-4 border border-translucent-emerald bg-forest-obsidian p-4">
                  <h3 className="mb-3 text-xs font-semibold text-bone-white font-mono uppercase tracking-wider">Badge Progress</h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-bone-white/70">Contributor Score:</span>
                      <span className="font-semibold text-bone-white">
                        {typedProfile.contributor_score || 0} / 50
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-bone-white/70">Total Upvotes Received:</span>
                      <span className="font-semibold text-bone-white">
                        {totalUpvotes} / 10
                      </span>
                    </div>
                    <div className="mt-3 border border-translucent-emerald bg-muted-moss p-2 text-[10px] text-bone-white/70 font-mono">
                      <strong>Requirement:</strong> Need 50 Contributor Score & 10 Upvotes for Trusted Voice status
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button - Self-view vs Public view */}
              {isOwner ? (
                // Owner: Show Private View indicator and Edit Profile button
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                    <span className="border border-translucent-emerald bg-forest-obsidian/50 px-2 py-1 text-bone-white/80">
                      Private View
                    </span>
                  </div>
                  <EditProfileButton profile={typedProfile} />
                </div>
              ) : (
                // Public Viewer: Show Track Intelligence button
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

