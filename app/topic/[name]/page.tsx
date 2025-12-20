import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash, Home } from "lucide-react";
import TopicFilter from "@/components/topics/TopicFilter";
import { getFollowedTopics } from "@/app/actions/topic-actions";
import TopicContentList from "@/components/topics/TopicContentList";
import NewsletterSlideIn from "@/components/newsletter/NewsletterSlideIn";
import MostHelpfulSidebar from "@/components/topics/MostHelpfulSidebar";

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
      is_pinned,
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
  const allFilteredDiscussions = (allDiscussions || []).filter((d: any) => {
    if (!d.tags || d.tags.length === 0) return false;
    return d.tags.includes(topicName);
  }) as (Discussion & { is_pinned?: boolean })[];

  // Separate pinned (intro) discussions from regular ones
  const pinnedDiscussions = allFilteredDiscussions.filter((d) => d.is_pinned === true);
  const regularDiscussions = allFilteredDiscussions.filter((d) => !d.is_pinned);

  // Sort: pinned first, then by date
  const discussions = [...pinnedDiscussions, ...regularDiscussions];

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
