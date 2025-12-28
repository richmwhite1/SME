import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageCircle, Twitter, Instagram } from "lucide-react";
import EditProfileButton from "@/components/profile/EditProfileButton";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";
import ProfileActivity from "@/components/profile/ProfileActivity";
import TrustWeight from "@/components/ui/TrustWeight";
import { getDb } from "@/lib/db";
import { getTopSmeSummons, SmeSummons } from "@/app/actions/sme-actions";
import SmeSummonsFeed from "@/components/profile/SmeSummonsFeed";

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
  contributor_score: number | null;
  email: string | null;
  social_links: any | null;
  badge_type: string | null;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const clerkUser = await currentUser();
  const currentUserId = clerkUser?.id || null;
  const sql = getDb();

  let profile: Profile | null = null;
  let followerCount = 0;
  let followingCount = 0;
  let isFollowing = false;
  let totalUpvotes = 0;
  let verifiedCitations = 0;
  let isVerifiedSme = false;
  let smeSummons: SmeSummons[] = [];

  try {
    // Fetch profile by username
    const profileResult = await sql`
      SELECT id, full_name, username, bio, credentials, profession, website_url, avatar_url, contributor_score, email, social_links, badge_type
      FROM profiles
      WHERE username = ${username}
      LIMIT 1
    `;

    if (profileResult && profileResult.length > 0) {
      profile = profileResult[0] as Profile;
    } else {
      notFound();
    }

    const profileId = profile.id;

    // Run parallel queries for stats
    const [
      followerResult,
      followingResult,
      followStatusResult,
      upvotesResult,
      citationsResult
    ] = await Promise.all([
      // Follower count
      sql`SELECT count(*) as count FROM follows WHERE following_id = ${profileId}`,

      // Following count
      sql`SELECT count(*) as count FROM follows WHERE follower_id = ${profileId}`,

      // Is following status (if logged in)
      currentUserId ? sql`SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = ${profileId} LIMIT 1` : Promise.resolve([]),

      // Total upvotes received on discussions
      sql`
        SELECT count(*) as count 
        FROM discussion_votes dv
        JOIN discussions d ON dv.discussion_id = d.id
        WHERE d.author_id = ${profileId}
      `,

      // Verified citations (discussions with verified links/resources)
      sql`SELECT count(*) as count FROM discussions WHERE author_id = ${profileId}`
    ]);

    followerCount = parseInt(followerResult[0]?.count || '0');
    followingCount = parseInt(followingResult[0]?.count || '0');
    isFollowing = followStatusResult.length > 0;
    totalUpvotes = parseInt(upvotesResult[0]?.count || '0');
    verifiedCitations = parseInt(citationsResult[0]?.count || '0');

    // SME Summons Logic
    const isOwner = currentUserId === profileId;
    // Reputation Tier 3 (Verified SME) check => Score >= 300
    isVerifiedSme = (profile.contributor_score || 0) >= 300;

    if (isOwner && isVerifiedSme) {
      try {
        smeSummons = await getTopSmeSummons(5);
      } catch (e) {
        console.error("Failed to fetch SME summons", e);
      }
    }

  } catch (error) {
    console.error("Error fetching profile data:", error);
    // If profile fetch failed, we should probably 404 or error
    if (!profile) notFound();
  }

  if (!profile) {
    notFound();
  }

  const isOwner = currentUserId === profile.id;
  const typedProfile = profile;

  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column: Profile Info */}
          <div className="md:col-span-1">
            <div className="border border-translucent-emerald bg-muted-moss p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-sme-gold">
                  <Image
                    src={typedProfile.avatar_url || "/placeholder-avatar.png"}
                    alt={typedProfile.full_name || typedProfile.username || "User"}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <h1 className="mb-1 font-serif text-2xl font-bold text-bone-white">
                {typedProfile.full_name}
              </h1>
              <div className="mb-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {typedProfile.badge_type === "Trusted Voice" && (
                    <span className="border border-sme-gold bg-sme-gold/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-sme-gold">
                      Trusted Voice
                    </span>
                  )}
                  {typedProfile.badge_type === "Trusted Contributor" && (
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
                <div className="mb-4 flex flex-wrap gap-2 justify-center">
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
              <div className="mb-4 grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="text-center">
                  <div className="font-semibold text-bone-white text-lg">{followerCount || 0}</div>
                  <div className="text-bone-white/60 uppercase tracking-wider text-[10px]">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-bone-white text-lg">{followingCount || 0}</div>
                  <div className="text-bone-white/60 uppercase tracking-wider text-[10px]">Following</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-heart-green text-lg">
                    {typedProfile.contributor_score || 0}
                  </div>
                  <div className="text-bone-white/60 uppercase tracking-wider text-[10px]">Contributor
                    Score</div>
                </div>
              </div>

              {/* Badge Progress - Only visible to profile owner */}
              {isOwner && (
                <div className="mb-4 border border-translucent-emerald bg-forest-obsidian p-4 text-left">
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
                    <div className="mt-3 border border-translucent-emerald bg-muted-moss p-2 text-[10px] text-bone-white/70 font-mono leading-relaxed">
                      <strong>Requirement:</strong> Need 10 Contributor Score & 10 Upvotes for Trusted Voice status
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button - Self-view vs Public view */}
              {isOwner ? (
                // Owner: Show Private View indicator and Edit Profile button
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                    <span className="border border-translucent-emerald bg-forest-obsidian/50 px-2 py-1 text-bone-white/80">
                      Private View
                    </span>
                  </div>
                  <EditProfileButton profile={typedProfile} />
                </div>
              ) : (
                // Public Viewer: Show Follow button
                <ProfileFollowButton
                  targetUserId={typedProfile.id}
                  isFollowing={isFollowing}
                />
              )}
            </div>
          </div>

          {/* Right Column: Activity */}
          <div className="md:col-span-2">
            {isOwner && isVerifiedSme && smeSummons.length > 0 && (
              <SmeSummonsFeed summons={smeSummons} />
            )}
            <ProfileActivity userId={typedProfile.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
