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
import AvatarLink from "@/components/profile/AvatarLink";
import TopicContentList from "@/components/topics/TopicContentList";

export const dynamic = "force-dynamic";

interface Discussion {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  upvote_count: number;
  profiles: {
    id: string;
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

export default async function TopicViewPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const supabase = createClient();
  const user = await currentUser();

  // Decode topic name from URL
  const topicName = decodeURIComponent(topic);

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
        id,
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
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <Link
          href="/discussions"
          className="mb-6 inline-flex items-center gap-2 text-bone-white/70 hover:text-bone-white font-mono transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-heart-green" />
              <h1 className="font-serif text-4xl font-bold text-bone-white">#{topicName}</h1>
            </div>
            {user && (
              <TopicFilter topic={topicName} isFollowed={isTopicFollowed} />
            )}
          </div>
          {!user && (
            <div className="border border-translucent-emerald bg-muted-moss p-4">
              <p className="text-sm text-bone-white/80 font-mono">
                Sign in to follow this topic and see personalized content in your feed.
              </p>
            </div>
          )}
        </div>

        {/* Content List */}
        <TopicContentList allContent={allContent} topicName={topicName} />
      </div>
    </main>
  );
}

