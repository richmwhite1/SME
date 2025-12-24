"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CommentForm from "@/components/comments/CommentForm";
import CitationText from "@/components/comments/CitationText";
import { UserCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import AvatarLink from "@/components/profile/AvatarLink";
import TrustWeight from "@/components/ui/TrustWeight";
import UserBadge from "@/components/UserBadge";

import { toggleCommentVote } from "@/app/actions/vote-actions";
import { Lightbulb, ThumbsUp } from "lucide-react";

// Recursive comment thread component with Binary Indent Firewall
function CommentThread({ comment, depth = 0, parentUsername }: { comment: Comment; depth?: number; parentUsername?: string | null }) {
  // HARD FIREWALL: Binary Indentation - className + inline style backup
  // Rule: depth === 0 ? 'ml-0' : 'ml-5 border-l border-white/10'
  // No reply can ever indent more than 20px (ml-5 = 1.25rem = 20px)
  const isGuest = !comment.profiles && comment.guest_name;
  const marginLeft = depth === 0 ? '0px' : '20px';

  const [upvoteCount, setUpvoteCount] = useState(comment.upvote_count || 0);
  const [isUpvoted, setIsUpvoted] = useState(false); // We don't have initial user state yet, defaulting to false or need to fetch
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);

    // Optimistic update
    const newIsUpvoted = !isUpvoted;
    setIsUpvoted(newIsUpvoted);
    setUpvoteCount(prev => newIsUpvoted ? prev + 1 : prev - 1);

    try {
      const result = await toggleCommentVote(comment.id, 'product');
      if (result.success) {
        setUpvoteCount(result.upvoteCount);
        setIsUpvoted(result.isUpvoted);
      } else {
        // Revert on failure
        setIsUpvoted(!newIsUpvoted);
        setUpvoteCount(prev => newIsUpvoted ? prev - 1 : prev + 1);
        console.error("Vote failed:", result.error);
      }
    } catch (error) {
      setIsUpvoted(!newIsUpvoted);
      setUpvoteCount(prev => newIsUpvoted ? prev - 1 : prev + 1);
      console.error("Vote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div
      className={depth === 0 ? 'ml-0' : 'ml-5 border-l border-white/10'}
      style={{ marginLeft }}
      data-comment-depth={depth}
    >
      {/* SIGNAL BRIDGE: Context for flattened threads - show for ANY nested comment */}
      {depth > 0 && parentUsername && (
        <span
          className="text-[10px] text-sme-gold/60 font-mono mb-1 pl-4 block"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Replying to @{parentUsername}
        </span>
      )}

      <div className="border border-translucent-emerald bg-muted-moss p-4 relative group">
        <div className="mb-3 flex items-start gap-3">
          {isGuest ? (
            <div className="flex-shrink-0">
              <UserCircle size={32} className="text-bone-white/40" />
            </div>
          ) : comment.profiles ? (
            <Link
              href={comment.profiles.username
                ? `/u/${comment.profiles.username}`
                : `/profile/${comment.profiles.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <AvatarLink
                userId={comment.profiles.id}
                username={comment.profiles.username}
                avatarUrl={comment.profiles.avatar_url}
                fullName={comment.profiles.full_name}
                size={32}
              />
            </Link>
          ) : null}
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2 flex-wrap">
              {isGuest ? (
                <>
                  <span className="font-semibold text-bone-white">
                    {comment.guest_name}
                  </span>
                  <span className="border border-bone-white/20 bg-bone-white/5 px-2 py-0.5 text-xs font-medium text-bone-white/50 font-mono uppercase">
                    GUEST
                  </span>
                </>
              ) : comment.profiles ? (
                <>
                  <Link
                    href={comment.profiles.username
                      ? `/u/${comment.profiles.username}`
                      : `/profile/${comment.profiles.id}`}
                    className="font-semibold text-bone-white hover:text-heart-green transition-colors truncate max-w-[150px]"
                  >
                    {comment.profiles.full_name || "Anonymous"}
                  </Link>
                  <UserBadge profile={comment.profiles} />
                  {comment.profiles.username && (
                    <Link
                      href={`/u/${comment.profiles.username}`}
                      className="text-xs text-bone-white/70 hover:text-bone-white transition-colors truncate max-w-[100px]"
                    >
                      @{comment.profiles.username}
                    </Link>
                  )}
                  {comment.profiles.contributor_score !== null && comment.profiles.contributor_score > 0 && (
                    <TrustWeight
                      value={comment.profiles.contributor_score}
                      className="ml-1"
                    />
                  )}
                  {comment.profiles.badge_type === "Trusted Voice" && (
                    <span className="border border-heart-green bg-heart-green/20 px-2 py-0.5 text-xs font-medium text-heart-green font-mono uppercase whitespace-nowrap">
                      Trusted Voice
                    </span>
                  )}
                </>
              ) : (
                <span className="font-semibold text-bone-white">Anonymous</span>
              )}
              <span className="text-xs text-bone-white/50 font-mono whitespace-nowrap">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* INSIGHT SUMMARY BLOCK */}
            {comment.insight_summary && (
              <div className="mb-3 p-3 bg-emerald-900/20 border-l-2 border-emerald-500 rounded-r shadow-sm">
                <div className="flex items-start gap-2">
                  <Lightbulb size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-emerald-100/90 font-medium leading-relaxed">
                    <span className="text-xs uppercase tracking-wider text-emerald-500/80 mr-2 font-bold block mb-1">Key Insight</span>
                    {comment.insight_summary}
                  </p>
                </div>
              </div>
            )}

            <div className="whitespace-pre-wrap text-bone-white/90 leading-relaxed font-mono text-sm md:text-base">
              <CitationText content={comment.content} />
            </div>

            {/* ACTION BAR */}
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={handleVote}
                disabled={isVoting}
                className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${isUpvoted ? 'text-emerald-400' : 'text-bone-white/40 hover:text-emerald-400'
                  }`}
                title="Endorse this perspective"
              >
                <ThumbsUp size={14} className={isUpvoted ? "fill-emerald-400/20" : ""} />
                <span>{upvoteCount || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Recursive children - Binary depth: always 1 for nested, never increment */}
      {/* Binary Indent Firewall: All nested comments use depth=1, enforcing 20px max indent */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-2 space-y-2" data-comment-list>
          {comment.children.map((child) => (
            <CommentThread
              key={child.id}
              comment={child}
              depth={1}
              parentUsername={comment.profiles?.username || comment.profiles?.full_name || comment.guest_name || null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  children?: Comment[];
  guest_name?: string | null;
  insight_summary?: string | null;
  upvote_count?: number;
  profiles: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    badge_type: string | null;
    contributor_score: number | null;
  } | null;
  // Allow for extension (e.g. has_citation)
  [key: string]: any;
}

interface ProductCommentsProps {
  productId: string;
  productSlug: string;
  initialComments: Comment[];
}

export default function ProductComments({
  productId,
  productSlug,
  initialComments,
}: ProductCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);

  // Sync state with props when router.refresh() updates initialComments
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Build threaded comment tree
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map and initialize children
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Second pass: build tree
    comments.forEach((comment) => {
      const commentNode = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(commentNode);
        } else {
          // Orphaned comment (parent deleted), treat as root
          rootComments.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    return rootComments;
  };

  const threadedComments = buildCommentTree(comments);

  return (
    <div className="mt-16 space-y-6 border-t border-translucent-emerald pt-12">
      <h2 className="font-serif text-3xl font-semibold text-bone-white">Comments</h2>

      {/* Comment Form */}
      <CommentForm
        type="product"
        productId={productId}
        productSlug={productSlug}
        onSuccess={async () => {
          // Refresh comments via Server Actions / Router Refresh
          router.refresh();
        }}
      />

      {/* Comments List */}
      <div
        data-comment-list
        className="space-y-4 transition-all duration-300"
      >
        {threadedComments.length === 0 ? (
          <p className="text-center text-bone-white font-mono">Signal Pending: Be the first auditor to share your intuition.</p>
        ) : (
          threadedComments.map((comment) => (
            <CommentThread key={comment.id} comment={comment} depth={0} parentUsername={null} />
          ))
        )}
      </div>
    </div>
  );
}

