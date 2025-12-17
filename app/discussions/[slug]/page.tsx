import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import DiscussionComments from "@/components/discussions/DiscussionComments";
import CitationButton from "@/components/ui/CitationButton";

export const dynamic = "force-dynamic";

export default async function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createClient();
  const user = await currentUser();

  // Fetch discussion by slug, fallback to id if slug doesn't match
  let { data: discussion, error } = await supabase
    .from("discussions")
    .select(`
      id,
      title,
      content,
      tags,
      slug,
      reference_url,
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
    .eq("slug", slug)
    .eq("is_flagged", false)
    .single();

  // If not found by slug, try by id
  if (error || !discussion) {
    const { data: discussionById } = await supabase
      .from("discussions")
      .select(`
        id,
        title,
        content,
        tags,
        slug,
        reference_url,
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
      .eq("id", slug)
      .eq("is_flagged", false)
      .single();

    if (!discussionById) {
      notFound();
    }
    discussion = discussionById;
  }

  if (!discussion) {
    notFound();
  }

  // Fetch comments for this discussion
  // Handle null is_flagged values (comments created before flagging was added)
  const { data: comments } = await supabase
    .from("discussion_comments")
    .select(`
      id,
      content,
      created_at,
      profiles!discussion_comments_author_id_fkey(
        full_name,
        username,
        avatar_url,
        badge_type
      )
    `)
    .eq("discussion_id", discussion.id)
    .or("is_flagged.eq.false,is_flagged.is.null")
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Back Link */}
        <Link
          href="/discussions"
          className="mb-6 inline-flex items-center gap-2 text-earth-green hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Discussions
        </Link>

        {/* Discussion Card */}
        <div className="mb-8 rounded-xl bg-white/50 p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h1 className="mb-4 text-3xl font-bold text-deep-stone">{discussion.title}</h1>

            {/* Author Info */}
            <div className="mb-4 flex items-center gap-3">
              {discussion.profiles?.avatar_url ? (
                <Image
                  src={discussion.profiles.avatar_url}
                  alt={discussion.profiles.full_name || "User"}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-soft-clay text-sm font-semibold text-deep-stone">
                  {discussion.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-deep-stone">
                    {discussion.profiles?.full_name || "Anonymous"}
                  </span>
                  {discussion.profiles?.username && (
                    <span className="text-sm text-deep-stone/60">
                      @{discussion.profiles.username}
                    </span>
                  )}
                  {discussion.profiles?.badge_type === "Trusted Voice" && (
                    <span className="rounded-full bg-earth-green/20 px-2 py-0.5 text-xs font-medium text-earth-green">
                      Trusted Voice
                    </span>
                  )}
                </div>
                <span className="text-sm text-deep-stone/60">
                  {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4 whitespace-pre-wrap text-deep-stone/80">
              {discussion.content}
            </div>

            {/* Tags */}
            {discussion.tags && discussion.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {discussion.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-earth-green/20 px-3 py-1 text-xs font-medium text-earth-green"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Citation */}
            {discussion.reference_url && (
              <div className="mb-4">
                <CitationButton url={discussion.reference_url} />
              </div>
            )}

            {/* Upvote Count */}
            {discussion.upvote_count > 0 && (
              <div className="flex items-center gap-2 text-sm text-deep-stone/60">
                <MessageSquare className="h-4 w-4" />
                <span>{discussion.upvote_count} upvote{discussion.upvote_count !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="rounded-xl bg-white/50 p-8 backdrop-blur-sm">
          <DiscussionComments
            discussionId={discussion.id}
            discussionSlug={discussion.slug}
            initialComments={(comments || []) as any}
          />
        </div>
      </div>
    </main>
  );
}

