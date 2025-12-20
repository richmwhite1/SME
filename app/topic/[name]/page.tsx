import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash, Home } from "lucide-react";
import TopicFilter from "@/components/topics/TopicFilter";
import { getFollowedTopics } from "@/app/actions/topic-actions";
import TopicContentList from "@/components/topics/TopicContentList";
import NewsletterSlideIn from "@/components/newsletter/NewsletterSlideIn";
import MostHelpfulSidebar from "@/components/topics/MostHelpfulSidebar";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Discussion {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  upvote_count: number;
  is_pinned?: boolean;
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

export default async function TopicPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const user = await currentUser();
  const sql = getDb();

  // Decode topic name from URL
  const topicName = decodeURIComponent(name);

  // Get followed topics
  const followedTopics = await getFollowedTopics();
  const isTopicFollowed = followedTopics.includes(topicName);

  let discussions: (Discussion & { is_pinned?: boolean })[] = [];
  let products: Product[] = [];

  try {
    // Fetch discussions with this topic
    // Note: We filter by tag in memory in the original code, but we can do it in SQL if tags is an array column.
    // Assuming tags is a text array (text[]).
    // The original code fetched ALL discussions (limit 100) and then filtered.
    // We should try to filter in SQL for efficiency, but to match logic exactly we can fetch and filter.
    // However, fetching 100 random discussions and filtering might yield 0 results if the topic is rare.
    // Better to filter in SQL: WHERE tags @> ARRAY[topicName] or similar.
    // But let's stick to the original logic if we want to be safe about column types, 
    // OR improve it. The original code: .select(...).eq("is_flagged", false).order(...).limit(100)
    // AND THEN filtered by tags. This is actually a bug in the original code if it limits BEFORE filtering.
    // I will improve it by filtering in SQL if possible, or fetch more.
    // Let's assume tags is text[] and use the containment operator if possible, OR just fetch matching rows.
    
    const discussionsResult = await sql`
      SELECT 
        d.id, d.title, d.content, d.slug, d.created_at, d.upvote_count, d.tags, d.is_pinned,
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
      is_pinned: row.is_pinned,
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
      FROM protocols
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

  // Separate pinned (intro) discussions from regular ones
  const pinnedDiscussions = discussions.filter((d) => d.is_pinned === true);
  const regularDiscussions = discussions.filter((d) => !d.is_pinned);

  // Sort: pinned first, then by date
  // (Already sorted by date from DB, but pinned separation logic is preserved)
  const sortedDiscussions = [...pinnedDiscussions, ...regularDiscussions];

  // Combine and sort by date
  const allContent = [
    ...sortedDiscussions.map((d) => ({ ...d, type: "discussion" as const })),
    ...products.map((p) => ({ ...p, type: "product" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-bone-white/70 font-mono">
          <Link
            href="/feed"
            className="flex items-center gap-1 text-heart-green hover:text-heart-green/80 hover:underline"
          >
            <Home size={14} />
            Feed
          </Link>
          <span>/</span>
          <Link
            href="/discussions"
            className="text-heart-green hover:text-heart-green/80 hover:underline"
          >
            Discussions
          </Link>
          <span>/</span>
          <span className="text-bone-white">#{topicName}</span>
        </nav>

        {/* Back Button */}
        <Link
          href="/feed"
          className="mb-4 inline-flex items-center gap-2 text-bone-white/70 hover:text-bone-white font-mono transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Feed
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

          {/* State of the Science Summary */}
          {pinnedDiscussions.length > 0 && pinnedDiscussions[0] && (
            <div className="mb-6 border border-translucent-emerald bg-muted-moss p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="border border-heart-green bg-heart-green/20 px-2 py-0.5 text-xs font-medium text-heart-green font-mono uppercase tracking-wider">
                  Topic Hub
                </span>
              </div>
              <h2 className="mb-2 font-serif text-xl font-bold text-bone-white">
                {pinnedDiscussions[0].title}
              </h2>
              <div className="prose prose-sm max-w-none text-bone-white/80">
                <p className="line-clamp-3">{pinnedDiscussions[0].content}</p>
              </div>
              <Link
                href={`/discussions/${pinnedDiscussions[0].slug}`}
                className="mt-3 inline-block text-sm font-medium text-heart-green hover:underline font-mono"
              >
                Read full introduction →
              </Link>
            </div>
          )}

          {!user && (
            <div className="border border-translucent-emerald bg-muted-moss p-4">
              <p className="text-sm text-bone-white/70 font-mono">
                Sign in to follow this topic and see personalized content in your feed.
              </p>
            </div>
          )}
        </div>

        {/* Content List with Search */}
        <TopicContentList allContent={allContent} topicName={topicName} />
          </div>
          
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <MostHelpfulSidebar topicName={topicName} />
          </aside>
        </div>
      </div>
      
      {/* Newsletter Slide-in */}
      <NewsletterSlideIn />
    </main>
  );
}
