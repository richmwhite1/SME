import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Star, MessageSquare, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import TrustedVoicesToggle from "@/components/feed/TrustedVoicesToggle";
import FeedTabs from "@/components/feed/FeedTabs";
import TopicFilter from "@/components/topics/TopicFilter";
import TopicBadge from "@/components/topics/TopicBadge";
import TopicLeaderboard from "@/components/topics/TopicLeaderboard";
import MyTopics from "@/components/topics/MyTopics";
import { getFollowedTopics } from "@/app/actions/topic-actions";

export const dynamic = "force-dynamic";

interface FeedItem {
  activity_type: "review" | "discussion";
  activity_id: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  title: string;
  content: string;
  tags: string[] | null;
  related_id: string | null;
  related_type: string | null;
  protocol_slug?: string | null;
  protocol_title?: string | null;
}

interface RecommendedContributor {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  contributor_score: number;
  bio: string | null;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ trusted?: string; tab?: string; topic?: string }>;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  const isTrustedOnly = params.trusted === "true";
  const activeTab = (params.tab || "tribe") as "tribe" | "pulse" | "interests";
  const topicFilter = params.topic;

  const supabase = createClient();

  // Check if user is following anyone
  const { data: following, error: followingError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const isFollowingAnyone = following && following.length > 0;

  // Get followed topics for My Interests tab
  const followedTopics = await getFollowedTopics();

  let feedItems: FeedItem[] = [];
  let recommendedContributors: RecommendedContributor[] = [];

  // Handle different tabs
  if (activeTab === "tribe" && isFollowingAnyone && following) {
    // My Tribe: Follower feed
    const followingIds = following.map((f: { following_id: string }) => f.following_id);
    
    // If trusted only, get users with Trusted Voice badge first
    let userIdsToFetch = followingIds;
    if (isTrustedOnly) {
      const { data: trustedUsers } = await supabase
        .from("profiles")
        .select("id")
        .in("id", followingIds)
        .eq("badge_type", "Trusted Voice");
      
      userIdsToFetch = trustedUsers?.map((u: { id: string }) => u.id) || [];
    }
    
    // Fetch reviews from followed users (filtered by trusted if needed)
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(`
        id,
        created_at,
        user_id,
        content,
        protocol_id,
        profiles!reviews_user_id_fkey(full_name, avatar_url, badge_type),
        protocols!reviews_protocol_id_fkey(slug, title)
      `)
      .in("user_id", userIdsToFetch)
      .eq("is_flagged", false)
      .order("created_at", { ascending: false })
      .limit(30);

    // Fetch discussions from followed users (filtered by trusted if needed)
    const { data: discussions, error: discussionsError } = await supabase
      .from("discussions")
      .select(`
        id,
        created_at,
        author_id,
        title,
        content,
        tags,
        profiles!discussions_author_id_fkey(full_name, avatar_url, badge_type)
      `)
      .in("author_id", userIdsToFetch)
      .eq("is_flagged", false)
      .order("created_at", { ascending: false })
      .limit(30);

    // Combine and sort by date
    const allItems: FeedItem[] = [];

    if (reviews && !reviewsError) {
      reviews.forEach((review: any) => {
        allItems.push({
          activity_type: "review",
          activity_id: review.id,
          created_at: review.created_at,
          author_id: review.user_id,
          author_name: review.profiles?.full_name || "Anonymous",
          author_avatar: review.profiles?.avatar_url || null,
          title: review.content.substring(0, 100),
          content: review.content,
          tags: null,
          related_id: review.protocol_id,
          related_type: "protocol",
          protocol_slug: review.protocols?.slug || null,
          protocol_title: review.protocols?.title || null,
        });
      });
    }

    if (discussions && !discussionsError) {
      discussions.forEach((discussion: any) => {
        allItems.push({
          activity_type: "discussion",
          activity_id: discussion.id,
          created_at: discussion.created_at,
          author_id: discussion.author_id,
          author_name: discussion.profiles?.full_name || "Anonymous",
          author_avatar: discussion.profiles?.avatar_url || null,
          title: discussion.title,
          content: discussion.content,
          tags: discussion.tags,
          related_id: null,
          related_type: null,
        });
      });
    }

    // Sort by date and limit
    feedItems = allItems
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  } else if (activeTab === "interests") {
    // My Interests: Fetch content where tags contain any followed topic
    if (followedTopics.length > 0) {
      // Fetch discussions with matching tags
      let discussionsQuery = supabase
        .from("discussions")
        .select(`
          id,
          created_at,
          author_id,
          title,
          content,
          tags,
          slug,
          profiles!discussions_author_id_fkey(full_name, avatar_url, badge_type)
        `)
        .eq("is_flagged", false);

      // Filter by tags containing any followed topic
      // Supabase doesn't support array overlap directly, so we'll filter in code
      const { data: allDiscussions } = await discussionsQuery
        .order("created_at", { ascending: false })
        .limit(100);

      // Filter discussions that have tags matching followed topics
      const matchingDiscussions = (allDiscussions || []).filter((d: any) => {
        if (!d.tags || d.tags.length === 0) return false;
        return d.tags.some((tag: string) => followedTopics.includes(tag));
      });

      matchingDiscussions.forEach((discussion: any) => {
        feedItems.push({
          activity_type: "discussion",
          activity_id: discussion.id,
          created_at: discussion.created_at,
          author_id: discussion.author_id,
          author_name: discussion.profiles?.full_name || "Anonymous",
          author_avatar: discussion.profiles?.avatar_url || null,
          title: discussion.title,
          content: discussion.content,
          tags: discussion.tags,
          related_id: null,
          related_type: null,
          protocol_slug: discussion.slug,
        });
      });

      // Fetch protocols with matching tags (if protocols have tags)
      // Note: Protocols may not have tags column, adjust as needed
      const { data: protocols } = await supabase
        .from("protocols")
        .select(`
          id,
          created_at,
          title,
          problem_solved,
          slug,
          tags
        `)
        .not("tags", "is", null)
        .limit(100);

      if (protocols) {
        const matchingProtocols = protocols.filter((p: any) => {
          if (!p.tags || p.tags.length === 0) return false;
          return p.tags.some((tag: string) => followedTopics.includes(tag));
        });

        matchingProtocols.forEach((protocol: any) => {
          feedItems.push({
            activity_type: "review", // Using review type for products
            activity_id: protocol.id,
            created_at: protocol.created_at,
            author_id: "",
            author_name: "Product",
            author_avatar: null,
            title: protocol.title,
            content: protocol.problem_solved,
            tags: protocol.tags,
            related_id: protocol.id,
            related_type: "protocol",
            protocol_slug: protocol.slug,
            protocol_title: protocol.title,
          });
        });
      }

      // Sort by date
      feedItems = feedItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  } else if (activeTab === "pulse") {
    // Community Pulse: Global feed
    const { data: globalFeed } = await supabase
      .from("global_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (globalFeed) {
      feedItems = globalFeed.map((item: any) => ({
        activity_type: item.activity_type === "review" ? "review" : "discussion",
        activity_id: item.activity_id,
        created_at: item.created_at,
        author_id: item.author_id,
        author_name: item.author_name,
        author_avatar: item.author_avatar,
        title: item.title,
        content: item.content,
        tags: item.tags,
        related_id: item.related_id,
        related_type: item.related_type,
        protocol_slug: item.protocol_slug,
        protocol_title: item.protocol_title,
      }));
    }
  }

  // Get recommended contributors if on Tribe tab and not following anyone
  if (activeTab === "tribe" && !isFollowingAnyone) {
    // Show recommended contributors based on highest contributor scores
    const { data: recommended, error: recommendedError } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, contributor_score, bio")
      .not("username", "is", null)
      .neq("id", user.id)
      .order("contributor_score", { ascending: false })
      .limit(10);

    if (recommendedError) {
      console.error("Error fetching recommended contributors:", recommendedError);
    } else {
      recommendedContributors = (recommended || []) as RecommendedContributor[];
    }
  }

  // Apply topic filter if present
  if (topicFilter) {
    feedItems = feedItems.filter((item) => {
      if (!item.tags || item.tags.length === 0) return false;
      return item.tags.includes(topicFilter);
    });
  }

  // Get followed status for topic filter
  const isTopicFollowed = topicFilter ? followedTopics.includes(topicFilter) : false;

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-deep-stone">My Feed</h1>
            <p className="text-lg text-deep-stone/70">
              {activeTab === "tribe"
                ? isFollowingAnyone
                  ? "Activity from contributors you follow"
                  : "Discover top contributors to get started"
                : activeTab === "pulse"
                  ? "All community activity"
                  : "Content from topics you follow"}
            </p>
          </div>
          {activeTab !== "interests" && <TrustedVoicesToggle />}
        </div>

        <FeedTabs activeTab={activeTab} />

        {topicFilter && (
          <TopicFilter topic={topicFilter} isFollowed={isTopicFollowed} />
        )}

        {activeTab === "tribe" && isFollowingAnyone ? (
          // Follower Feed
          <div className="space-y-6">
            {feedItems.length === 0 ? (
              <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
                <p className="mb-4 text-deep-stone/70">
                  No activity from people you follow yet.
                </p>
                <Link
                  href="/products"
                  className="text-earth-green hover:underline"
                >
                  Explore products →
                </Link>
              </div>
            ) : (
              feedItems.map((item) => (
                <FeedItemCard key={`${item.activity_type}-${item.activity_id}`} item={item} />
              ))
            )}
          </div>
        ) : activeTab === "tribe" ? (
          // Recommended Contributors
          <div>
            <div className="mb-6 rounded-xl bg-white/50 p-6 backdrop-blur-sm">
              <h2 className="mb-2 text-2xl font-semibold text-deep-stone">
                Recommended Contributors
              </h2>
              <p className="text-deep-stone/70">
                Follow top contributors to see their activity in your feed
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {recommendedContributors.map((contributor) => (
                <RecommendedContributorCard
                  key={contributor.id}
                  contributor={contributor}
                />
              ))}
            </div>

            {recommendedContributors.length === 0 && (
              <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
                <p className="text-deep-stone/70">
                  No recommended contributors found.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Community Pulse or My Interests
          <div className="space-y-6">
            {feedItems.length === 0 ? (
              <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
                <p className="mb-4 text-deep-stone/70">
                  {activeTab === "interests"
                    ? followedTopics.length === 0
                      ? "Follow topics to see content here. Click on any tag to follow it!"
                      : "No content found for your followed topics yet."
                    : "No activity found."}
                </p>
                {activeTab === "interests" && followedTopics.length === 0 && (
                  <Link
                    href="/discussions"
                    className="text-earth-green hover:underline"
                  >
                    Explore discussions →
                  </Link>
                )}
              </div>
            ) : (
              feedItems.map((item) => (
                <FeedItemCard key={`${item.activity_type}-${item.activity_id}`} item={item} />
              ))
            )}
          </div>
        )}
          </div>
          <aside className="lg:col-span-1 space-y-6">
            <MyTopics />
            <TopicLeaderboard />
          </aside>
        </div>
      </div>
    </main>
  );
}

function FeedItemCard({ item }: { item: FeedItem }) {
  return (
    <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
      <div className="mb-4 flex items-start gap-4">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          {item.author_avatar ? (
            <Image
              src={item.author_avatar}
              alt={item.author_name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft-clay text-lg font-semibold text-deep-stone">
              {item.author_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold text-deep-stone">{item.author_name}</span>
            <span className="text-sm text-deep-stone/60">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>

          {item.activity_type === "review" ? (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-deep-stone/60">
                <Star className="h-4 w-4 fill-earth-green text-earth-green" />
                <span>Review</span>
                {item.protocol_slug && item.protocol_title && (
                  <Link
                    href={`/products/${item.protocol_slug}`}
                    className="text-earth-green hover:underline"
                  >
                    on {item.protocol_title}
                  </Link>
                )}
              </div>
              <p className="leading-relaxed text-deep-stone/80">{item.content}</p>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-deep-stone/60">
                <MessageSquare className="h-4 w-4 text-earth-green" />
                <span>Discussion</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-deep-stone">{item.title}</h3>
              <p className="leading-relaxed text-deep-stone/80">{item.content}</p>
              {item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <TopicBadge key={tag} topic={tag} clickable={true} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendedContributorCard({
  contributor,
}: {
  contributor: RecommendedContributor;
}) {
  return (
    <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
      <div className="mb-4 flex items-start gap-4">
        {contributor.avatar_url ? (
          <Image
            src={contributor.avatar_url}
            alt={contributor.full_name || "User"}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-clay text-2xl font-semibold text-deep-stone">
            {contributor.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}

        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold text-deep-stone">
            {contributor.full_name || "Anonymous"}
          </h3>
          {contributor.username && (
            <Link
              href={`/u/${contributor.username}`}
              className="text-sm text-earth-green hover:underline"
            >
              @{contributor.username}
            </Link>
          )}
          {contributor.bio && (
            <p className="mt-2 text-sm leading-relaxed text-deep-stone/70 line-clamp-2">
              {contributor.bio}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-earth-green">
              <span className="font-semibold">{contributor.contributor_score || 0}</span>{" "}
              Contributor Score
            </div>
            {contributor.username && (
              <Link
                href={`/u/${contributor.username}`}
                className="flex items-center gap-1 text-sm text-earth-green hover:underline"
              >
                View Profile <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

