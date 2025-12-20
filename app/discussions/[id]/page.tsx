import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import DiscussionComments from '@/components/discussions/DiscussionComments';
import AvatarLink from '@/components/profile/AvatarLink';
import TopicBadge from '@/components/topics/TopicBadge';
import { formatDistanceToNow } from 'date-fns';

interface Discussion {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  is_bounty: boolean;
  solution_comment_id: string | null;
  bounty_status: string | null;
  upvote_count: number;
  tags: string[];
  slug: string;
  profiles: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    contributor_score: number;
    badge_type: string | null;
  };
}

interface DiscussionComment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  guest_name: string | null;
  profiles: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    badge_type: string | null;
    contributor_score: number;
  } | null;
}

interface CommentReference {
  resource_id: string;
  resource_title: string;
  resource_url: string;
}

export default async function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const user = await currentUser();
  
  // Fetch discussion with full profile data
  const { data: discussion, error } = await supabase
    .from('discussions')
    .select(`
      *,
      profiles!discussions_author_id_fkey(
        id,
        full_name,
        username,
        avatar_url,
        contributor_score,
        badge_type
      )
    `)
    .eq('id', id)
    .single() as { data: Discussion | null, error: any };

  if (error || !discussion) {
    return notFound();
  }

  // Fetch initial comments with references
  const { data: commentsData } = await supabase
    .from('discussion_comments')
    .select(`
      id,
      content,
      created_at,
      parent_id,
      guest_name,
      profiles!discussion_comments_author_id_fkey(
        id,
        full_name,
        username,
        avatar_url,
        badge_type,
        contributor_score
      )
    `)
    .eq('discussion_id', id)
    .or('is_flagged.eq.false,is_flagged.is.null')
    .order('created_at', { ascending: true }) as { data: DiscussionComment[] | null };

  // Fetch references for each comment with error handling
  const commentsWithReferences = await Promise.all(
    (commentsData || []).map(async (comment) => {
      try {
        const { data: refsData } = await supabase
          .from('comment_references')
          .select('resource_id, resource_title, resource_url')
          .eq('comment_id', comment.id) as { data: CommentReference[] | null };

        return {
          ...comment,
          references: (refsData || []).map((ref) => ({
            resource_id: ref.resource_id,
            resource_title: ref.resource_title,
            resource_url: ref.resource_url,
          })),
        };
      } catch (error) {
        // Table doesn't exist or query failed - continue with empty references
        console.warn('comment_references table query failed:', error);
        return {
          ...comment,
          references: [],
        };
      }
    })
  );

  const isAuthor = user?.id === discussion.author_id;
  const isBounty = discussion.is_bounty || false;
  const solutionCommentId = discussion.solution_comment_id || null;
  const bountyStatus = discussion.bounty_status || null;

  return (
    <main className="min-h-screen bg-forest-obsidian text-bone-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Main Discussion Post */}
        <div className="border border-translucent-emerald bg-muted-moss p-6 sm:p-8 mb-6">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-bone-white mb-3">
              {discussion.title}
            </h1>
            
            {/* Author & Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-bone-white/70 font-mono">
              {discussion.profiles && (
                <div className="flex items-center gap-2">
                  <AvatarLink
                    userId={discussion.profiles.id}
                    username={discussion.profiles.username}
                    avatarUrl={discussion.profiles.avatar_url}
                    fullName={discussion.profiles.full_name}
                    size={24}
                  />
                  <span>
                    {discussion.profiles.full_name || 'Anonymous'}
                    {discussion.profiles.username && (
                      <span className="ml-1">@{discussion.profiles.username}</span>
                    )}
                  </span>
                </div>
              )}
              <span>•</span>
              <span>{formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}</span>
              {discussion.upvote_count > 0 && (
                <>
                  <span>•</span>
                  <span className="text-sme-gold">{discussion.upvote_count} upvote{discussion.upvote_count !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {discussion.tags.map((tag: string) => (
                <TopicBadge key={tag} topic={tag} clickable={true} />
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert max-w-none text-bone-white/90 leading-relaxed font-mono text-sm">
            {discussion.content}
          </div>
        </div>

        {/* Interaction Terminal - Community Audit Section */}
        <div className="border-t-2 border-sme-gold bg-muted-moss">
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between border-b border-translucent-emerald pb-3">
              <h2 className="text-lg font-serif font-semibold text-bone-white">
                <span className="text-sme-gold">{commentsWithReferences.length}</span> Community Signals Recorded
              </h2>
            </div>
            
            <SignedIn>
              <DiscussionComments
                discussionId={id}
                discussionSlug={discussion.slug}
                discussionTitle={discussion.title}
                initialComments={commentsWithReferences as any}
                isBounty={isBounty}
                bountyStatus={bountyStatus}
                solutionCommentId={solutionCommentId}
                isAuthor={isAuthor}
              />
            </SignedIn>
            
            <SignedOut>
              <div className="border border-translucent-emerald bg-forest-obsidian p-6 text-center">
                <p className="text-bone-white font-mono text-sm mb-4">
                  Verify your SME status to weigh in on this signal.
                </p>
                <p className="text-bone-white/60 font-mono text-xs">
                  Only verified Subject Matter Experts can contribute to discussion signals.
                </p>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>
    </main>
  );
}
