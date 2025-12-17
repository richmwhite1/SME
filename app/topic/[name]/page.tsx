import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import TopicFilter from "@/components/topics/TopicFilter";
import { getFollowedTopics } from "@/app/actions/topic-actions";
import TopicBadge from "@/components/topics/TopicBadge";

export const dynamic = "force-dynamic";

interface Discussion {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  upvote_count: number;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    badge_type: string | null;
  } | null;
  tags: string[] | null;
}

interface Product {
  id: string;
  title: string;
  problem_solved: string;
  slug: string;
  created_at: string;
  tags: string[] | null;
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const supabase = createClient();
  const user = await currentUser();

  // Decode topic name from URL
  const topicName = decodeURIComponent(name);

  // Get followed topics
  const followedTopics = await getFollowedTopics();
  const isTopicFollowed = followedTopics.includes(topicName);

  // Fetch discussions with this topic
  const { data: allDiscussions } = await supabase
    .from("discussions")
    .select(`
      id,
      title,
      content,
      slug,
      created_at,
      upvote_count,
      tags,
      profiles!discussions_author_id_fkey(
        full_name,
        username,
        avatar_url,
        badge_type
      )
    `)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .limit(100);

  // Filter discussions that have this topic in tags
  const discussions = (allDiscussions || []).filter((d: any) => {
    if (!d.tags || d.tags.length === 0) return false;
    return d.tags.includes(topicName);
  }) as Discussion[];

  // Fetch products/protocols with this topic (if protocols have tags)
  const { data: allProducts } = await supabase
    .from("protocols")
    .select("id, title, problem_solved, slug, created_at, tags")
    .not("tags", "is", null)
    .limit(100);

  const products = (allProducts || []).filter((p: any) => {
    if (!p.tags || p.tags.length === 0) return false;
    return p.tags.includes(topicName);
  }) as Product[];

  // Combine and sort by date
  const allContent = [
    ...discussions.map((d) => ({ ...d, type: "discussion" as const })),
    ...products.map((p) => ({ ...p, type: "product" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <Link
          href="/discussions"
          className="mb-6 inline-flex items-center gap-2 text-earth-green hover:underline"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-earth-green" />
              <h1 className="text-4xl font-bold text-deep-stone">#{topicName}</h1>
            </div>
            {user && (
              <TopicFilter topic={topicName} isFollowed={isTopicFollowed} />
            )}
          </div>
          {!user && (
            <div className="rounded-lg border border-earth-green/30 bg-earth-green/10 p-4">
              <p className="text-sm text-deep-stone/80">
                Sign in to follow this topic and see personalized content in your feed.
              </p>
            </div>
          )}
        </div>

        {/* Content List */}
        {allContent.length === 0 ? (
          <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
            <p className="text-deep-stone/70">
              No content found for #{topicName} yet. Be the first to post about it!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {allContent.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={
                  item.type === "discussion"
                    ? `/discussions/${item.slug}`
                    : `/products/${item.slug}`
                }
                className="block rounded-xl bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
              >
                <div className="mb-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-earth-green/20 px-2 py-0.5 text-xs font-medium text-earth-green">
                      {item.type === "discussion" ? "Discussion" : "Product"}
                    </span>
                    <span className="text-sm text-deep-stone/60">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-deep-stone">
                    {item.title}
                  </h2>
                  {item.type === "discussion" ? (
                    <p className="mb-3 line-clamp-2 text-deep-stone/80">
                      {(item as Discussion).content}
                    </p>
                  ) : (
                    <p className="mb-3 line-clamp-2 text-deep-stone/80">
                      {(item as Product).problem_solved}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {item.type === "discussion" && (item as Discussion).profiles && (
                    <div className="flex items-center gap-3">
                      {(item as Discussion).profiles?.avatar_url ? (
                        <Image
                          src={(item as Discussion).profiles!.avatar_url!}
                          alt={(item as Discussion).profiles!.full_name || "User"}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-clay text-xs font-semibold text-deep-stone">
                          {(item as Discussion).profiles?.full_name?.charAt(0).toUpperCase() ||
                            "U"}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-deep-stone">
                            {(item as Discussion).profiles?.full_name || "Anonymous"}
                          </span>
                          {(item as Discussion).profiles?.badge_type === "Trusted Voice" && (
                            <span className="rounded-full bg-earth-green/20 px-2 py-0.5 text-xs font-medium text-earth-green">
                              Trusted Voice
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.tags
                        .filter((tag) => tag !== topicName)
                        .slice(0, 3)
                        .map((tag) => (
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
    </main>
  );
}
