"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    Heart,
    MessageCircle,
    Smile,
    Hand,
    UserCircle,
    Award,
    CheckCircle2,
    Lightbulb,
    BookOpen,
    ExternalLink,
    MoreHorizontal,
    CornerDownRight,
    ShieldCheck
} from "lucide-react";
import { Comment } from "@/types/comment";
import AvatarLink from "@/components/profile/AvatarLink";
import UserBadge from "@/components/UserBadge";
import TrustWeight from "@/components/ui/TrustWeight";
import CitationText from "@/components/comments/CitationText";
import { useUser } from "@clerk/nextjs";
import { toggleCommentVote } from "@/app/actions/vote-actions";
import { toggleCommentSignal } from "@/app/actions/signal-actions";
import { toggleReaction } from "@/app/actions/discussion-actions";
import { useToast } from "@/components/ui/ToastContainer";
import EmojiPicker from "@/components/ui/EmojiPicker";

interface WaterfallCommentProps {
    comment: Comment;
    isAnchor?: boolean;
    onFocus: (commentId: string) => void;
    depth?: number;
    type: 'product' | 'discussion';
    isSME?: boolean;
    onReactionUpdate?: () => void;
}

export default function WaterfallComment({
    comment,
    isAnchor = false,
    onFocus,
    depth = 0,
    type,
    isSME = false,
    onReactionUpdate
}: WaterfallCommentProps) {
    const { user, isSignedIn } = useUser();
    const { showToast } = useToast();

    const [upvoteCount, setUpvoteCount] = useState(comment.upvote_count || 0);
    const [isUpvoted, setIsUpvoted] = useState(false); // ToDo: fetch initial state
    const [isVoting, setIsVoting] = useState(false);

    const [signalCount, setSignalCount] = useState(comment.raise_hand_count || 0);
    const [isSignaled, setIsSignaled] = useState(false); // ToDo: fetch initial state
    const [isSignaling, setIsSignaling] = useState(false);

    const isGuest = !comment.profiles && comment.guest_name;
    const replyCount = comment.children?.length || 0;

    // Vote Handler
    const isVerifiedSME = isSME || (comment.profiles?.badge_type === 'Trusted Voice') || (comment.profiles?.is_verified_expert === true);

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isVoting) return;
        if (!isSignedIn) {
            showToast("Please sign in to vote", "error");
            return;
        }

        setIsVoting(true);
        const newIsUpvoted = !isUpvoted;
        // Optimistic
        setIsUpvoted(newIsUpvoted);
        setUpvoteCount(prev => newIsUpvoted ? prev + 1 : prev - 1);

        try {
            const result = await toggleCommentVote(comment.id, type);
            if (result.success) {
                setUpvoteCount(result.upvoteCount);
                setIsUpvoted(result.isUpvoted);
            } else {
                // Revert
                setIsUpvoted(!newIsUpvoted);
                setUpvoteCount(prev => newIsUpvoted ? prev - 1 : prev + 1);
                showToast(result.error || "Vote failed", "error");
            }
        } catch (err) {
            setIsUpvoted(!newIsUpvoted);
            setUpvoteCount(prev => newIsUpvoted ? prev - 1 : prev + 1);
        } finally {
            setIsVoting(false);
        }
    };

    // Signal (Raise Hand) Handler
    const handleSignal = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSignaling) return;
        if (!isSignedIn) {
            showToast("Please sign in to raise your hand", "error");
            return;
        }

        setIsSignaling(true);
        const newIsSignaled = !isSignaled;
        // Optimistic
        setIsSignaled(newIsSignaled);
        setSignalCount(prev => newIsSignaled ? prev + 1 : prev - 1);

        try {
            const result = await toggleCommentSignal(comment.id, type);
            if (result.success) {
                setSignalCount(result.signalCount);
                setIsSignaled(result.isSignaled);
                if (result.isSignaled) {
                    showToast("Hand Raised! An expert has been notified.", "success");
                }
            } else {
                // Revert
                setIsSignaled(!newIsSignaled);
                setSignalCount(prev => newIsSignaled ? prev - 1 : prev + 1);
                showToast(result.error || "Signal failed", "error");
            }
        } catch (err) {
            setIsSignaled(!newIsSignaled);
            setSignalCount(prev => newIsSignaled ? prev - 1 : prev + 1);
        } finally {
            setIsSignaling(false);
        }
    };



    const handleReaction = async (emoji: string) => {
        if (!isSignedIn) {
            showToast("Please sign in to react", "error");
            return;
        }

        // Optimistic update (handled by parent refresh mostly, but we could do local state)
        // For now, rely on parent refresh via onReactionUpdate
        try {
            await toggleReaction(comment.id, emoji);
            if (onReactionUpdate) onReactionUpdate();
        } catch (err: any) {
            showToast(err.message, "error");
        }
    };

    const handleDrillDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocus(comment.id);
    };

    return (
        <div className={`group relative transition-all ${isAnchor ? 'mb-8' : 'mb-4'}`}>

            {/* Thread Line - Subtle Vertical Line for Flat Threading */}
            {!isAnchor && depth > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/5" />
            )}

            {/* Official Response Badge */}
            {comment.is_official_response && (
                <div className="flex items-center gap-2 mb-2 ml-1 text-sme-gold text-xs font-mono uppercase tracking-wider">
                    <ShieldCheck size={14} className="fill-sme-gold/10" />
                    <span>Official SME Response</span>
                </div>
            )}

            <div
                className={`
          relative border p-4 rounded-lg transition-all
          ${isAnchor
                        ? 'bg-forest-obsidian border-sme-gold/30 shadow-[0_0_20px_-5px_var(--sme-gold-alpha)]'
                        : 'bg-black/20 border-white/5 hover:border-white/10'
                    }
          ${comment.is_official_response ? 'border-sme-gold/50 bg-sme-gold/5' : ''}
          ${isVerifiedSME ? 'sme-verified' : ''}
        `}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                    {/* Avatar */}
                    {isGuest ? (
                        <div className="flex-shrink-0">
                            <UserCircle size={isAnchor ? 40 : 32} className="text-bone-white/40" />
                        </div>
                    ) : comment.profiles ? (
                        <div className="flex-shrink-0">
                            <AvatarLink
                                userId={comment.profiles.id}
                                username={comment.profiles.username}
                                avatarUrl={comment.profiles.avatar_url}
                                fullName={comment.profiles.full_name}
                                size={isAnchor ? 40 : 32}
                            />
                        </div>
                    ) : null}

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                            <span className={`font-semibold text-bone-white ${isAnchor ? 'text-lg' : 'text-sm'}`}>
                                {comment.profiles?.full_name || comment.profiles?.username || comment.guest_name || "Anonymous"}
                            </span>
                            {!isGuest && comment.profiles && (
                                <UserBadge profile={comment.profiles} />
                            )}
                            {comment.profiles?.contributor_score && comment.profiles.contributor_score > 0 && (
                                <TrustWeight value={comment.profiles.contributor_score} className="scale-90 origin-left" />
                            )}
                            <span className="text-xs text-bone-white/50 font-mono ml-auto">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Insight Summary */}
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

                {/* Content */}
                <div className={`font-mono text-bone-white/90 whitespace-pre-wrap leading-relaxed ${isAnchor ? 'text-base' : 'text-sm'}`}>
                    <CitationText content={comment.content} />
                </div>

                {/* Sources/References */}
                {comment.references && comment.references.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {comment.references.map((ref, idx) => (
                            <a
                                key={idx}
                                href={ref.resource_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-white/10 rounded text-[10px] text-bone-white/60 hover:text-heart-green hover:border-heart-green/50 transition-colors"
                            >
                                <BookOpen size={10} />
                                <span className="truncate max-w-[150px]">{ref.resource_title}</span>
                                {ref.resource_url && <ExternalLink size={8} />}
                            </a>
                        ))}
                    </div>
                )}

                {/* Action Bar (Engagement Bar) */}
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex items-center gap-4">
                        {/* Vote */}
                        <button
                            onClick={handleVote}
                            className={`flex items-center gap-1.5 group/btn transition-colors ${isUpvoted ? 'text-heart-green' : 'text-bone-white/40 hover:text-heart-green'}`}
                            title="Upvote"
                        >
                            <Heart size={16} className={`transition-transform group-active/btn:scale-95 ${isUpvoted ? 'fill-heart-green' : ''}`} />
                            <span className="text-xs font-mono">{upvoteCount}</span>
                        </button>

                        {/* Reply / Drill Down */}
                        <button
                            onClick={handleDrillDown}
                            className={`flex items-center gap-1.5 group/btn transition-colors ${isAnchor ? 'text-bone-white/80' : 'text-bone-white/40 hover:text-bone-white'}`}
                            title="Drill Down / Reply"
                        >
                            <MessageCircle size={16} className={`transition-transform group-active/btn:scale-95 ${isAnchor ? 'fill-white/10' : ''}`} />
                            <span className="text-xs font-mono">{replyCount > 0 ? replyCount : ''}</span>
                        </button>

                        {/* Raise Hand (Signal) */}
                        <button
                            onClick={handleSignal}
                            className={`flex items-center gap-1.5 group/btn transition-colors ${isSignaled ? 'text-sme-gold' : 'text-bone-white/40 hover:text-sme-gold'}`}
                            title="Raise Hand for Expert Review"
                        >
                            <Hand size={16} className={`transition-transform group-active/btn:scale-95 ${isSignaled ? 'fill-sme-gold' : ''}`} />
                            {signalCount > 0 && <span className="text-xs font-mono">{signalCount}</span>}
                        </button>

                        {/* Emoji Picker */}
                        <div className="relative">
                            <EmojiPicker
                                onEmojiSelect={handleReaction}
                                buttonClassName="text-bone-white/40 hover:text-yellow-400 transition-colors"
                            />
                        </div>

                        {/* Existing Reactions */}
                        {comment.reactions && comment.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 ml-2">
                                {comment.reactions.map((r, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleReaction(r.emoji)}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-all ${r.user_reacted
                                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                                            : 'bg-white/5 border-transparent text-bone-white/60 hover:bg-white/10'
                                            }`}
                                        title={`${r.count} people reacted with ${r.emoji}`}
                                    >
                                        <span>{r.emoji}</span>
                                        <span className="font-mono">{r.count}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SME Tools */}
                    {isVerifiedSME && !isAnchor && (
                        <div className="text-[10px] text-sme-gold font-mono uppercase tracking-wider flex items-center gap-1">
                            <Award size={12} />
                            Certified Expert
                        </div>
                    )}
                </div>

            </div>

            {/* Children rendering for Anchor */}
            {isAnchor && replyCount > 0 && (
                <div className="mt-4 pl-0 space-y-4">
                    <div className="flex items-center gap-2 text-xs text-bone-white/40 font-mono mb-2">
                        <CornerDownRight size={14} />
                        <span>{replyCount} Direct Replies</span>
                    </div>
                </div>
            )}
        </div>
    );
};
