import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, BookOpen, TrendingUp, Award, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import TopicBadge from "@/components/topics/TopicBadge";
import TopicLeaderboard from "@/components/topics/TopicLeaderboard";
import MyTopics from "@/components/topics/MyTopics";
import LatestIntelligence from "@/components/social/LatestIntelligence";
import FeedCalibration from "@/components/feed/FeedCalibration";
import FeedVisitTracker from "@/components/feed/FeedVisitTracker";
import FeedClient from "@/components/feed/FeedClient";
import FeedRefresher from "@/components/feed/FeedRefresher";
import FeedItemCard from "@/components/feed/FeedItemCard";
import { getFollowedTopics } from "@/app/actions/topic-actions";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface UserLastComment {
  created_at: string;
}

interface NewReply {
  id: string;
  created_at: string;
}

interface DiscussionDetail {
  id: string;
  title: string;
  slug: string;
  tags: string[] | null;
  profiles?: {
    id: string;
    full_name: string;
    username: string;
  };
}

interface ActiveThread {
  discussion_id: string;
  discussion_slug: string;
  discussion_title: string;
  last_reply_at: string;
  reply_count: number;
  author_name: string | null;
  author_username: string | null;
  tags: string[] | null;
}

interface Evidence {
  origin_type: string;
  origin_id: string;
  title: string;
  reference_url: string | null;
  created_at: string;
  author_name: string | null;
  author_username: string | null;
}

interface FollowedSignalItem {
  id: string;
  type: "product" | "discussion" | "evidence";
  title: string;
  content: string;
  created_at: string;
  author_id?: string | null;
  author_name: string | null;
  author_username: string | null;
  slug: string | null;
  tags: string[] | null;
  is_sme_certified?: boolean;
}

interface AllDiscussion {
  id: string;
  title: string;
  content: string;
  slug: string;
  tags: string[] | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    username: string;
    badge_type: string | null;
  };
}

interface TrustTrendItem {
  id: string;
  type: "product" | "discussion";
  title: string;
  content: string;
  created_at: string;
  author_id?: string | null;
  author_name: string | null;
  author_username: string | null;
  slug: string;
  tags: string[] | null;
  topic: string;
  signal_score: number;
}

export default async function FeedPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  const followedTopics = await getFollowedTopics();
  const sql = getDb();

  // Get tracked SMEs (users being followed)
  const trackedSMEsResult = await sql`
    SELECT following_id 
    FROM follows 
    WHERE follower_id = ${user.id}
  `;
  const trackedSMEIds = trackedSMEsResult.map((f: any) => f.following_id);

  // 1. Active Threads: Discussions user commented on with new replies
  const activeThreads: ActiveThread[] = [];

  // Get discussions user has commented on
  const userCommentsResult = await sql`
    SELECT DISTINCT discussion_id 
    FROM discussion_comments 
    WHERE author_id = ${user.id} 
      AND discussion_id IS NOT NULL
  `;

  if (userCommentsResult.length > 0) {
    const discussionIds = userCommentsResult.map((c: any) => c.discussion_id);

    // Get discussions with new replies (replies after user's last comment)
    for (const discussionId of discussionIds) {
      // Get user's last comment time
      const userLastCommentResult = await sql`
        SELECT created_at 
        FROM discussion_comments 
        WHERE discussion_id = ${discussionId} 
          AND author_id = ${user.id} 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const userLastComment = userLastCommentResult[0];

      if (userLastComment && userLastComment.created_at) {
        // Get replies after user's last comment
        const newRepliesResult = await sql`
          SELECT id, created_at 
          FROM discussion_comments 
          WHERE discussion_id = ${discussionId} 
            AND created_at > ${userLastComment.created_at} 
            AND author_id != ${user.id}
        `;

        if (newRepliesResult.length > 0) {
          // Get discussion details
          const discussionResult = await sql`
            SELECT 
              d.id, d.title, d.slug, d.tags, 
              p.full_name, p.username
            FROM discussions d
            LEFT JOIN profiles p ON d.author_id = p.id
            WHERE d.id = ${discussionId}
            LIMIT 1
          `;

          const discussion = discussionResult[0];

          if (discussion) {
            activeThreads.push({
              discussion_id: discussion.id,
              discussion_slug: discussion.slug,
              discussion_title: discussion.title,
              last_reply_at: newRepliesResult[0].created_at.toISOString(),
              reply_count: newRepliesResult.length,
              author_name: discussion.full_name || null,
              author_username: discussion.username || null,
              tags: discussion.tags,
            } as ActiveThread);
          }
        }
      }
    }
  }

  // Sort by last reply time
  activeThreads.sort(
    (a, b) => new Date(b.last_reply_at).getTime() - new Date(a.last_reply_at).getTime()
  );

  // 2. Followed Signal: New products/research in 12 Master Topics user follows
  const followedSignalItems: FollowedSignalItem[] = [];

  if (followedTopics.length > 0) {
    // Get master topics (12 core topics)
    const masterTopicsResult = await sql`
      SELECT name 
      FROM master_topics 
      ORDER BY display_order ASC 
      LIMIT 12
    `;

    const masterTopicNames = masterTopicsResult.map((t: any) => t.name);
    const followedMasterTopics = followedTopics.filter((t) =>
      masterTopicNames.includes(t)
    );

    if (followedMasterTopics.length > 0) {
      // Fetch discussions with matching tags
      const discussionsResult = await sql`
        SELECT 
          d.id, d.title, d.content, d.slug, d.tags, d.created_at,
          p.id as author_id, p.full_name, p.username
        FROM discussions d
        LEFT JOIN profiles p ON d.author_id = p.id
        WHERE d.is_flagged = false
          AND d.tags && ${sql.array(followedMasterTopics)}
        ORDER BY d.created_at DESC
        LIMIT 50
      `;

      if (discussionsResult.length > 0) {
        discussionsResult.forEach((d: any) => {
          followedSignalItems.push({
            id: d.id,
            type: "discussion",
            title: d.title,
            content: d.content,
            created_at: d.created_at.toISOString(),
            author_id: d.author_id,
            author_name: d.full_name,
            author_username: d.username,
            slug: d.slug,
            tags: d.tags,
          });
        });
      }

      // Fetch products with matching tags
      try {
        const productsResult = await sql`
          SELECT 
            id, title, problem_solved as content, slug, tags, created_at, is_sme_certified
          FROM products
          WHERE tags && ${sql.array(followedMasterTopics)}
          ORDER BY created_at DESC
          LIMIT 20
        `;

        if (productsResult.length > 0) {
          productsResult.forEach((p: any) => {
            followedSignalItems.push({
              id: p.id,
              type: "product",
              title: p.title,
              content: p.content,
              created_at: p.created_at.toISOString(),
              author_id: null,
              author_name: "Organic Intelligence",
              author_username: null,
              slug: p.slug,
              tags: p.tags,
              is_sme_certified: p.is_sme_certified,
            });
          });
        }
      } catch (err) {
        console.warn("Error fetching products for feed:", err);
      }
    }
  }

  // Sort followed signal items
  followedSignalItems.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Tracked SME Items
  const trackedSMEItems: FollowedSignalItem[] = [];
  if (trackedSMEIds.length > 0) {
    // Fetch discussions from tracked SMEs
    const smeDiscussionsResult = await sql`
      SELECT 
        d.id, d.title, d.content, d.slug, d.tags, d.created_at,
        p.id as author_id, p.full_name, p.username
      FROM discussions d
      LEFT JOIN profiles p ON d.author_id = p.id
      WHERE d.author_id IN ${sql(trackedSMEIds)}
        AND d.is_flagged = false
      ORDER BY d.created_at DESC
      LIMIT 20
    `;

    smeDiscussionsResult.forEach((d: any) => {
      trackedSMEItems.push({
        id: d.id,
        type: "discussion",
        title: d.title,
        content: d.content,
        created_at: d.created_at.toISOString(),
        author_id: d.author_id,
        author_name: d.full_name,
        author_username: d.username,
        slug: d.slug,
        tags: d.tags,
      });
    });

    // Fetch evidence submissions from tracked SMEs
    const smeEvidenceResult = await sql`
      SELECT 
        es.origin_id, es.title, es.reference_url, es.created_at,
        p.id as author_id, p.full_name as author_name, p.username as author_username
      FROM evidence_submissions es
      LEFT JOIN profiles p ON es.submitted_by = p.id
      WHERE es.submitted_by IN ${sql(trackedSMEIds)}
        AND es.status = 'verified'
      ORDER BY es.created_at DESC
      LIMIT 20
    `;

    smeEvidenceResult.forEach((ev: any) => {
      trackedSMEItems.push({
        id: ev.origin_id,
        type: "evidence",
        title: ev.title,
        content: ev.reference_url || "",
        created_at: ev.created_at.toISOString(),
        author_id: ev.author_id || null,
        author_name: ev.author_name,
        author_username: ev.author_username,
        slug: null,
        tags: null,
      });
    });
  }

  // Sort tracked SME items
  trackedSMEItems.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 3. Trust Trends: One 'High Signal' post from unfollowed topic
  let trustTrendItem: TrustTrendItem | null = null;
  if (followedTopics.length > 0) {
    // Get all discussions (limit 100)
    const allDiscussionsResult = await sql`
      SELECT 
        d.id, d.title, d.content, d.slug, d.tags, d.created_at,
        p.id as author_id, p.full_name, p.username, p.badge_type
      FROM discussions d
      LEFT JOIN profiles p ON d.author_id = p.id
      WHERE d.is_flagged = false
      ORDER BY d.created_at DESC
      LIMIT 100
    `;

    if (allDiscussionsResult.length > 0) {
      // Find discussions from Trusted Voices in unfollowed topics
      const unfollowedDiscussions = allDiscussionsResult.filter((d: any) => {
        if (!d.tags || d.tags.length === 0) return false;
        if (d.badge_type !== "Trusted Voice") return false;

        // Check if all tags are unfollowed
        return d.tags.every((tag: string) => !followedTopics.includes(tag));
      });

      if (unfollowedDiscussions.length > 0) {
        // Pick the most recent one
        const selected = unfollowedDiscussions[0];
        const firstUnfollowedTopic = selected.tags.find(
          (tag: string) => !followedTopics.includes(tag)
        );

        trustTrendItem = {
          id: selected.id,
          type: "discussion",
          title: selected.title,
          content: selected.content,
          created_at: selected.created_at.toISOString(),
          author_id: selected.author_id || null,
          author_name: selected.full_name || null,
          author_username: selected.username || null,
          slug: selected.slug,
          tags: selected.tags,
          topic: firstUnfollowedTopic || "",
          signal_score: 5, // High signal from Trusted Voice
        };
      }
    }
  }

  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <FeedVisitTracker />
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="mb-2 font-serif text-3xl font-bold text-bone-white">My Feed</h1>
              <p className="text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                Personalized research intelligence
              </p>
            </div>

            {/* Feed Client handles Calibration/Feed transition */}
            <FeedClient initialFollowedTopics={followedTopics}>
              {/* Feed Refresher - Shows when new signals are detected */}
              <FeedRefresher
                initialItemCount={
                  activeThreads.length +
                  trackedSMEItems.length +
                  followedSignalItems.length +
                  (trustTrendItem ? 1 : 0)
                }
                initialTimestamp={new Date().toISOString()}
                followedTopics={followedTopics}
              />

              {/* Active Threads */}
              {activeThreads.length > 0 && (
                <section className="mb-8 border border-translucent-emerald bg-muted-moss p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-third-eye-indigo" />
                    <h2 className="font-serif text-xl font-semibold text-bone-white">Active Threads</h2>
                  </div>
                  <p className="mb-4 text-xs text-bone-white/70 font-mono">
                    Discussions you&apos;ve commented on with new replies
                  </p>
                  <div className="space-y-3">
                    {activeThreads.slice(0, 5).map((thread) => (
                      <Link
                        key={thread.discussion_id}
                        href={`/discussions/${thread.discussion_id}`}
                        className="block border border-translucent-emerald bg-forest-obsidian p-4 transition-all duration-300 hover:border-heart-green active:scale-95"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="mb-1 font-serif text-base font-semibold text-bone-white truncate">
                              {thread.discussion_title}
                            </h3>
                            <div className="mb-2 flex items-center gap-2 text-xs text-bone-white/70 font-mono">
                              <span>
                                {thread.reply_count} new {thread.reply_count === 1 ? "reply" : "replies"}
                              </span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(thread.last_reply_at), { addSuffix: true })}
                              </span>
                            </div>
                            {thread.tags && thread.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {thread.tags.slice(0, 3).map((tag) => (
                                  <TopicBadge key={tag} topic={tag} clickable={true} />
                                ))}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-bone-white/50 flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Tracked SME Intelligence */}
              {trackedSMEItems.length > 0 && (
                <section className="mb-8 border border-sme-gold/30 bg-muted-moss p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-sme-gold" />
                    <h2 className="font-serif text-xl font-semibold text-bone-white">Tracked Intelligence</h2>
                  </div>
                  <p className="mb-4 text-xs text-bone-white/70 font-mono">
                    New discussions and SME Citations contributions from tracked SMEs
                  </p>
                  <div className="space-y-3">
                    {trackedSMEItems.slice(0, 10).map((item) => (
                      <FeedItemCard key={`sme-${item.type}-${item.id}`} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* Followed Signal */}
              {followedSignalItems.length > 0 && (
                <section className="mb-8 border border-translucent-emerald bg-muted-moss p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-heart-green" />
                    <h2 className="font-serif text-xl font-semibold text-bone-white">Followed Signal</h2>
                  </div>
                  <p className="mb-4 text-xs text-bone-white/70 font-mono">
                    New products and research in your followed Master Topics
                  </p>
                  <div className="space-y-3">
                    {followedSignalItems.slice(0, 10).map((item) => (
                      <FeedItemCard key={`${item.type}-${item.id}`} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* Trust Trends */}
              {trustTrendItem && (
                <section className="mb-8 border border-sme-gold/30 bg-muted-moss p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-sme-gold" />
                    <h2 className="font-serif text-xl font-semibold text-bone-white">Trust Trends</h2>
                    <span className="border border-sme-gold/30 bg-sme-gold/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-sme-gold">
                      High Signal
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-bone-white/70 font-mono">
                    Discovery from an unfollowed topic
                  </p>
                  <div className="border border-translucent-emerald bg-forest-obsidian p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <TopicBadge topic={trustTrendItem.topic} clickable={true} />
                      <span className="text-[10px] text-bone-white/50 font-mono">
                        {formatDistanceToNow(new Date(trustTrendItem.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <Link
                      href={`/discussions/${trustTrendItem.id}`}
                      className="block transition-colors hover:text-heart-green"
                    >
                      <h3 className="mb-2 font-serif text-lg font-semibold text-bone-white">
                        {trustTrendItem.title}
                      </h3>
                      <p className="mb-3 text-sm text-bone-white/80 font-mono leading-relaxed line-clamp-2">
                        {trustTrendItem.content}
                      </p>
                      {trustTrendItem.author_name && (
                        <div className="flex items-center gap-2 text-xs text-bone-white/70 font-mono">
                          <Award size={12} className="text-sme-gold" />
                          <span>Trusted Voice: </span>
                          {trustTrendItem.author_username ? (
                            <Link
                              href={`/u/${trustTrendItem.author_username}`}
                              className="hover:text-bone-white transition-colors"
                            >
                              {trustTrendItem.author_name}
                            </Link>
                          ) : (
                            <span>{trustTrendItem.author_name}</span>
                          )}
                        </div>
                      )}
                    </Link>
                  </div>
                </section>
              )}

              {/* Empty States */}
              {activeThreads.length === 0 && trackedSMEItems.length === 0 && followedSignalItems.length === 0 && !trustTrendItem && (
                <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
                  <p className="mb-4 text-sm text-bone-white/70 font-mono">
                    Your feed is empty. Start following topics to see personalized content!
                  </p>
                  <Link
                    href="/discussions"
                    className="inline-block text-xs font-medium text-heart-green hover:underline font-mono uppercase tracking-wider"
                  >
                    Explore Discussions →
                  </Link>
                </div>
              )}

              {/* Tagline - Anchored below feed content */}
              <div className="mt-12 mb-8 text-center border-t border-translucent-emerald pt-8">
                <p className="text-lg text-bone-white/80 font-mono">
                  Community-driven products for the gut, heart, and mind.
                </p>
              </div>
            </FeedClient>
          </div>
          <aside className="lg:col-span-1 space-y-6">
            <LatestIntelligence />
            <MyTopics />
            <TopicLeaderboard />
          </aside>
        </div>
      </div>
    </main>
  );
}
