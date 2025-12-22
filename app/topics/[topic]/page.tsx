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
import { getDb } from "@/lib/db";

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
  const user = await currentUser();
  const sql = getDb();

  // Decode topic name from URL
  const topicName = decodeURIComponent(topic);

  // Get followed topics
  const followedTopics = await getFollowedTopics();
  const isTopicFollowed = followedTopics.includes(topicName);

  let discussions: Discussion[] = [];
  let products: Product[] = [];

  try {
    // Fetch discussions with this topic
    const discussionsResult = await sql`
      SELECT 
        d.id, d.title, d.content, d.slug, d.created_at, d.upvote_count, d.tags,
        p.id as author_id, p.full_name, p.username, p.avatar_url, p.badge_type
      FROM discussions d
      LEFT JOIN profiles p ON d.author_id = p.id
      WHERE (d.is_flagged IS FALSE OR d.is_flagged IS NULL)
      AND ${topicName} = ANY(d.tags)
      ORDER BY d.created_at DESC
      LIMIT 100
    `;

    discussions = discussionsResult.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      slug: row.slug,
      created_at: row.created_at,
      upvote_count: row.upvote_count,
      tags: row.tags,
      profiles: row.author_id ? {
        id: row.author_id,
        full_name: row.full_name,
        username: row.username,
        avatar_url: row.avatar_url,
        badge_type: row.badge_type
      } : null
    }));

    // Fetch products/protocols with this topic
    const productsResult = await sql`
      SELECT id, title, problem_solved, slug, created_at, tags
      FROM products
      WHERE tags IS NOT NULL
      AND ${topicName} = ANY(tags)
      LIMIT 100
    `;

    products = productsResult.map((row: any) => ({
      id: row.id,
      title: row.title,
      problem_solved: row.problem_solved,
      slug: row.slug,
      created_at: row.created_at,
      tags: row.tags
    }));

  } catch (error) {
    console.error("Error fetching topic content:", error);
  }

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
