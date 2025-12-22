import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import DiscussionComments from '@/components/discussions/DiscussionComments';
import AvatarLink from '@/components/profile/AvatarLink';
import TopicBadge from '@/components/topics/TopicBadge';
import { formatDistanceToNow } from 'date-fns';
import { getDb } from '@/lib/db';
import { getDiscussionComments } from '@/app/actions/discussion-actions';

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

export default async function DiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const sql = getDb();

  // Fetch discussion with full profile data using raw SQL
  const discussionResult = await sql`
    SELECT 
      d.*,
      p.id as author_id,
      p.full_name,
      p.username,
      p.avatar_url,
      p.contributor_score,
      p.badge_type
    FROM discussions d
    LEFT JOIN profiles p ON d.author_id = p.id
    WHERE d.id = ${id}
    LIMIT 1
  `;

  const discussionData = discussionResult?.[0];

  if (!discussionData) {
    return notFound();
  }

  // Transform to expected shape
  const discussion: Discussion = {
    id: discussionData.id,
    title: discussionData.title,
    content: discussionData.content,
    created_at: discussionData.created_at,
    author_id: discussionData.author_id,
    is_bounty: discussionData.is_bounty,
    solution_comment_id: discussionData.solution_comment_id,
    bounty_status: discussionData.bounty_status,
    upvote_count: discussionData.upvote_count,
    tags: discussionData.tags || [],
    slug: discussionData.slug,
    profiles: {
      id: discussionData.author_id,
      full_name: discussionData.full_name,
      username: discussionData.username,
      avatar_url: discussionData.avatar_url,
      contributor_score: discussionData.contributor_score,
      badge_type: discussionData.badge_type
    }
  };

  // Fetch comments using the server action (which now includes references)
  let commentsWithReferences = [];
  try {
    commentsWithReferences = await getDiscussionComments(id);
  } catch (error) {
    console.error(`Failed to fetch comments for discussion ${id}:`, error);
    // Don't crash the page, just show no comments
  }

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
