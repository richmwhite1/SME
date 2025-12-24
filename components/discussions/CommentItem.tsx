'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Lightbulb, ThumbsUp } from 'lucide-react';
import { toggleCommentVote } from '@/app/actions/vote-actions';

export default function CommentItem({ comment, depth, discussionId, parentUsername }: any) {
  const { user } = useUser();
  const [isHighlighting, setIsHighlighting] = useState(false);

  const [upvoteCount, setUpvoteCount] = useState(comment.upvote_count || 0);
  const [isUpvoted, setIsUpvoted] = useState(false); // ToDo: fetch initial state if possible
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);

    // Optimistic update
    const newIsUpvoted = !isUpvoted;
    setIsUpvoted(newIsUpvoted);
    setUpvoteCount((prev: number) => newIsUpvoted ? prev + 1 : prev - 1);

    try {
      const result = await toggleCommentVote(comment.id, 'discussion');
      if (result.success) {
        setUpvoteCount(result.upvoteCount);
        setIsUpvoted(result.isUpvoted);
      } else {
        // Revert on failure
        setIsUpvoted(!newIsUpvoted);
        setUpvoteCount((prev: number) => newIsUpvoted ? prev - 1 : prev + 1);
        console.error("Vote failed:", result.error);
      }
    } catch (error) {
      setIsUpvoted(!newIsUpvoted);
      setUpvoteCount((prev: number) => newIsUpvoted ? prev - 1 : prev + 1);
      console.error("Vote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  // HARD FIREWALL: Binary Indentation (0 or 20px) - className + inline style backup
  // Rule: depth === 0 ? 'ml-0' : 'ml-5 border-l border-white/10'
  // No reply can ever indent more than 20px (ml-5 = 1.25rem = 20px)
  const authorId = comment.author?.id || comment.profiles?.id;
  const authorUsername = comment.author?.username || comment.profiles?.username;
  const isGuest = !comment.profiles && comment.guest_name;
  const marginLeft = depth === 0 ? '0px' : '20px';

  return (
    <div
      className={depth === 0 ? 'ml-0' : 'ml-5 border-l border-white/10'}
      style={{ marginLeft }}
      data-comment-depth={depth}
    >
      {/* SIGNAL BRIDGE: Context for flattened threads */}
      {depth > 0 && parentUsername && (
        <span
          className="text-[10px] text-sme-gold/60 font-mono mb-1 pl-4 block"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Replying to @{parentUsername}
        </span>
      )}

      <div className="bg-black/20 border border-white/5 rounded p-4 group">
        <div className="flex items-center gap-2 mb-2">
          {isGuest ? (
            <span className="font-bold text-sm text-bone-white/70">{comment.guest_name}</span>
          ) : authorId ? (
            <Link
              href={authorUsername
                ? `/u/${authorUsername}`
                : `/profile/${authorId}`}
              className="font-bold text-sm text-bone-white hover:text-heart-green transition-colors"
            >
              {comment.author?.username || comment.profiles?.full_name || 'Anonymous'}
            </Link>
          ) : (
            <span className="font-bold text-sm">{comment.author?.username || 'Anonymous'}</span>
          )}
          <span className="text-[10px] text-white/40">{comment.created_at}</span>
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

        <p className="text-bone-white text-sm leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        <div className="flex gap-4 mt-3 text-[10px] text-white/30 uppercase tracking-tighter items-center">
          <button
            onClick={handleVote}
            disabled={isVoting}
            className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${isUpvoted ? 'text-emerald-400' : 'hover:text-emerald-400'
              }`}
            title="Endorse this perspective"
          >
            <ThumbsUp size={12} className={isUpvoted ? "fill-emerald-400/20" : ""} />
            <span>{upvoteCount || 0}</span>
          </button>
          <button className="hover:text-sme-gold transition-colors">Copy Link</button>
          <button className="hover:text-sme-gold transition-colors">Share Card</button>
          <button className="hover:text-sme-gold transition-colors">Reply</button>
        </div>
      </div>

      {/* RECURSION: Binary depth - always 1 for nested, never increment */}
      {comment.replies?.map((reply: any) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={1}
          discussionId={discussionId}
          parentUsername={comment.author?.username}
        />
      ))}
    </div>
  );
}



