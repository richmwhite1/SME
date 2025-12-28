'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import VoteControl from '@/components/ui/VoteControl';
import ReactionBar from '@/components/ui/ReactionBar';
import SentimentSummary from '@/components/ui/SentimentSummary';

export default function CommentItem({ comment, depth, discussionId, parentUsername }: any) {
  const { user } = useUser();

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

        {/* REACTION SUMMARY */}
        {comment.recent_reactions && comment.recent_reactions.length > 0 && (
          <div className="mt-2">
            <SentimentSummary reactions={comment.recent_reactions} />
          </div>
        )}

        <div className="flex gap-4 mt-3 text-[10px] text-white/30 uppercase tracking-tighter items-center">

          <VoteControl
            resourceId={comment.id}
            resourceType="comment"
            initialUpvoteCount={comment.upvote_count || 0}
          // initialUserVote={comment.user_vote} // Passing if available, else null
          />

          <ReactionBar
            resourceId={comment.id}
            resourceType="comment"
          // initialUserReactions={comment.user_reactions}
          />

          <button className="hover:text-sme-gold transition-colors ml-2">Reply</button>
          <button className="hover:text-sme-gold transition-colors">Copy Link</button>
          <button className="hover:text-sme-gold transition-colors">Share Card</button>
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



