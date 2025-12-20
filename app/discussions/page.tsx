import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import TrustedVoicesToggle from "@/components/feed/TrustedVoicesToggle";
import TopicBadge from "@/components/topics/TopicBadge";
import TopicFilter from "@/components/topics/TopicFilter";
import TopicLeaderboard from "@/components/topics/TopicLeaderboard";
import MyTopics from "@/components/topics/MyTopics";
import LocalSearchBar from "@/components/search/LocalSearchBar";
import TagFilterBar from "@/components/search/TagFilterBar";
import TagSidebar from "@/components/discussions/TagSidebar";
import DiscussionsClient from "@/components/discussions/DiscussionsClient";
import DiscussionCard from "@/components/discussions/DiscussionCard";
import { Suspense } from "react";
import { getFollowedTopics } from "@/app/actions/topic-actions";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DiscussionsPage({
  searchParams,
}: {
  searchParams: Promise<{ trusted?: string; topic?: string; search?: string }>;
}) {
  const user = await currentUser();
  const params = await searchParams;
  const isTrustedOnly = params.trusted === "true";
  const topicFilter = params.topic;
  const searchQuery = params.search?.toLowerCase() || "";
  
  // Get followed topics
  const followedTopics = await getFollowedTopics();
  const isTopicFollowed = topicFilter ? followedTopics.includes(topicFilter) : false;
  
  const sql = getDb();
  let allDiscussions: any[] = [];

  try {
    // Fetch all discussions
    if (isTrustedOnly) {
      // Get trusted user IDs first
      const trustedUsers = await sql`
        SELECT id FROM profiles WHERE badge_type = 'Trusted Voice'
      `;
      
      const authorIds = trustedUsers.map((u: { id: string }) => u.id);
      
      if (authorIds.length > 0) {
        const placeholders = authorIds.map((_, i) => `$${i + 1}`).join(',');
        allDiscussions = await sql.unsafe(`
          SELECT id, title, content, tags, slug, created_at, upvote_count, author_id
          FROM discussions
          WHERE is_flagged = false AND author_id IN (${placeholders})
          ORDER BY created_at DESC
          LIMIT 100
        `, authorIds);
      }
    } else {
      allDiscussions = await sql`
        SELECT id, title, content, tags, slug, created_at, upvote_count, author_id
        FROM discussions
        WHERE is_flagged = false
        ORDER BY created_at DESC
        LIMIT 100
      `;
    }
  } catch (error) {
    console.error("Error fetching discussions:", error);
    allDiscussions = [];
  }
  // Extract all unique tags from ALL discussions (before filtering) with counts
  // This ensures the sidebar shows all available tags regardless of current filters
  const tagCounts = new Map<string, number>();
  (allDiscussions || []).forEach((d: any) => {
    if (d.tags && Array.isArray(d.tags)) {
      d.tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });
  
  const tagsWithCounts = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
  // Also get simple array for TagFilterBar (backward compatibility)
  const allTags = tagsWithCounts.map((t) => t.tag);
  // Apply topic filter if present
  let discussions = allDiscussions || [];
  if (topicFilter) {
    discussions = discussions.filter((d: any) => {
      if (!d.tags || d.tags.length === 0) return false;
      return d.tags.includes(topicFilter);
    });
  }
  // Apply search filter if present
  if (searchQuery) {
    discussions = discussions.filter((d: any) => {
      const titleMatch = d.title?.toLowerCase().includes(searchQuery);
      const contentMatch = d.content?.toLowerCase().includes(searchQuery);
      return titleMatch || contentMatch;
    });
  }
  return (
    <main className="min-h-screen bg-forest-obsidian">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="mb-2 font-serif text-3xl font-bold text-bone-white">Discussions</h1>
              <p className="text-sm text-bone-white/70 font-mono uppercase tracking-wider">
                Community Research & Analysis
              </p>
            </div>
            {user && (
              <Link href="/discussions/new">
                <Button variant="primary" className="flex items-center gap-2">
                  <Plus size={14} />
                  Start Discussion
                </Button>
              </Link>
            )}
          </div>
          
          {/* Search Bar - Apothecary Terminal */}
          <div className="mb-4">
            <Suspense fallback={<div className="h-10 w-full border border-translucent-emerald bg-muted-moss" />}>
              <DiscussionsClient searchQuery={searchQuery} />
            </Suspense>
          </div>
          {/* Filters Row */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <TagFilterBar tags={allTags} selectedTag={topicFilter} />
            </div>
            <div className="flex-shrink-0">
              <TrustedVoicesToggle />
            </div>
          </div>
        </div>
        {topicFilter && (
          <TopicFilter topic={topicFilter} isFollowed={isTopicFollowed} />
        )}
        {!discussions || discussions.length === 0 ? (
          <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-bone-white/30" />
            <p className="mb-4 text-sm text-bone-white/70">
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
              <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}
          </div>
        )}
          </div>
          <aside className="lg:col-span-1 space-y-6">
            {/* Tag Sidebar - Professional Research Filtering */}
            <div className="border border-translucent-emerald bg-muted-moss p-4">
              <TagSidebar tags={tagsWithCounts} selectedTag={topicFilter} />
            </div>
            <MyTopics />
            <TopicLeaderboard />
          </aside>
        </div>
      </div>
    </main>
  );
}
