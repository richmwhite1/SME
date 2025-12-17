import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import TrustedVoicesToggle from "@/components/feed/TrustedVoicesToggle";
import TopicBadge from "@/components/topics/TopicBadge";
import TopicFilter from "@/components/topics/TopicFilter";
import TopicLeaderboard from "@/components/topics/TopicLeaderboard";
import MyTopics from "@/components/topics/MyTopics";
import { getFollowedTopics } from "@/app/actions/topic-actions";

export const dynamic = "force-dynamic";

export default async function DiscussionsPage({
  searchParams,
}: {
  searchParams: Promise<{ trusted?: string; topic?: string }>;
}) {
  const supabase = createClient();
  const user = await currentUser();

  const params = await searchParams;
  const isTrustedOnly = params.trusted === "true";
  const topicFilter = params.topic;
  
  // Get followed topics
  const followedTopics = await getFollowedTopics();
  const isTopicFollowed = topicFilter ? followedTopics.includes(topicFilter) : false;

  // Fetch all discussions
  // If trusted only, get trusted user IDs first
  let authorIds: string[] | undefined = undefined;
  if (isTrustedOnly) {
    const { data: trustedUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("badge_type", "Trusted Voice");
    
    authorIds = trustedUsers?.map((u: { id: string }) => u.id) || [];
    
    // If no trusted users, return empty
    if (authorIds.length === 0) {
      // Return empty discussions
    }
  }

  let discussionsQuery = supabase
    .from("discussions")
    .select(`
      id,
      title,
      content,
      tags,
      slug,
      created_at,
      upvote_count,
      author_id,
      profiles!discussions_author_id_fkey(
        id,
        full_name,
        username,
        avatar_url,
        badge_type
      )
    `)
    .eq("is_flagged", false);

  if (isTrustedOnly && authorIds && authorIds.length > 0) {
    discussionsQuery = discussionsQuery.in("author_id", authorIds);
  } else if (isTrustedOnly) {
    // No trusted users, return empty
    discussionsQuery = discussionsQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // Impossible match
  }

  const { data: allDiscussions, error } = await discussionsQuery
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching discussions:", error);
  }

  // Apply topic filter if present
  let discussions = allDiscussions || [];
  if (topicFilter) {
    discussions = discussions.filter((d: any) => {
      if (!d.tags || d.tags.length === 0) return false;
      return d.tags.includes(topicFilter);
    });
  }

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-deep-stone">Discussions</h1>
              <p className="text-lg text-deep-stone/70">
                Join the conversation with the community
              </p>
            </div>
            {user && (
              <Link href="/discussions/new">
                <Button variant="primary" className="flex items-center gap-2">
                  <Plus size={16} />
                  Start Discussion
                </Button>
              </Link>
            )}
          </div>
          <div className="flex justify-end">
            <TrustedVoicesToggle />
          </div>
        </div>

        {topicFilter && (
          <TopicFilter topic={topicFilter} isFollowed={isTopicFollowed} />
        )}

        {!discussions || discussions.length === 0 ? (
          <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-deep-stone/30" />
            <p className="mb-4 text-lg text-deep-stone/70">
              No discussions yet. Be the first to start one!
            </p>
            {user && (
              <Link href="/discussions/new">
                <Button variant="primary">Start Discussion</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((discussion: any) => (
              <Link
                key={discussion.id}
                href={`/discussions/${discussion.slug}`}
                className="block rounded-xl bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="mb-2 text-xl font-semibold text-deep-stone">
                      {discussion.title}
                    </h2>
                    <p className="mb-3 line-clamp-2 text-deep-stone/80">
                      {discussion.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-deep-stone/60">
                    <span>
                      by {discussion.profiles?.full_name || "Anonymous"}
                      {discussion.profiles?.username && (
                        <span className="ml-1">@{discussion.profiles.username}</span>
                      )}
                    </span>
                    <span>
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </span>
                    {discussion.upvote_count > 0 && (
                      <span className="text-earth-green">
                        {discussion.upvote_count} upvote{discussion.upvote_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {discussion.tags && discussion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {discussion.tags.slice(0, 3).map((tag: string) => (
                        <TopicBadge key={tag} topic={tag} clickable={true} />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
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

