"use client";

import { useState, useRef, useEffect } from "react";
import { toggleReaction } from "@/app/actions/reaction-actions";
import { REACTION_EMOJIS, REACTION_LABELS, REACTION_DESCRIPTIONS, ReactionType } from "@/lib/reactions";
import { cn } from "@/lib/utils";
import { SmilePlus } from "lucide-react";

// Matches backend ResourceType
type ResourceType = 'discussion' | 'product' | 'comment'; // Note: backend action uses 'discussion' | 'product', but UI implies 'comment' resource ID for reactions usually target comments?
// Actually toggleReaction takes 'discussion' | 'product'. 
// But the prompt says "Implement a set of five emoticons for comment feedback".
// The DB tables are `discussion_comment_reactions`.
// So the `commentType` arg in `toggleReaction` is 'discussion' (for discussion comments) or 'product' (for product comments).
// BUT `ReactionBar` prop `resourceType` might be confusing.
// Let's assume `resourceType` passed here corresponds to the comment type context.
// Wait, `CommentItem` passes `resourceType="comment"`.
// And `VoteControl` handles that.
// But `toggleReaction` expects 'discussion' or 'product'.
// I need to align this.
// `WaterfallComment` knows `type` ('product' | 'discussion').
// `CommentItem` (for discussions) seems to be inside a discussion context.
// Let's rely on props.
// I will update ReactionBar to accept `commentType` instead of generic `resourceType` if strictly targeting comments.
// OR I mapping 'comment' to something? No, `toggleReaction` specifically differentiates discussion vs product comments.
// So `ReactionBar` needs to know which type of comment it is.
// I'll update the Props interface.

interface ReactionBarProps {
    resourceId: string;
    resourceType: 'discussion' | 'product'; // This should be the type of the COMMENT (discussion comment or product comment)
    initialUserReactions?: ReactionType[];
}

export default function ReactionBar({
    resourceId,
    resourceType,
    initialUserReactions = []
}: ReactionBarProps) {
    const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set(initialUserReactions));
    const [isOpen, setIsOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = async (type: ReactionType) => {
        const newSet = new Set(userReactions);
        const isActive = newSet.has(type);

        if (isActive) {
            newSet.delete(type);
        } else {
            newSet.add(type);
        }

        setUserReactions(newSet);
        // Close menu after selection for cleaner UX? Or keep open for multiple? 
        // Keep open for multiple is usually better if they want to tag multiple things.

        try {
            await toggleReaction(resourceId, resourceType, type);
        } catch (error) {
            console.error("Reaction failed", error);
            // Revert
            if (isActive) newSet.add(type); else newSet.delete(type);
            setUserReactions(new Set(newSet));
        }
    };

    const reactionTypes = Object.keys(REACTION_EMOJIS) as ReactionType[];

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            ref={menuRef}
        >
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300",
                    (isOpen || isHovering || userReactions.size > 0) ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-400" : "bg-transparent border-transparent text-bone-white/40 hover:text-bone-white/80"
                )}
                title="Add Reaction"
            >
                <SmilePlus size={16} />
                {userReactions.size > 0 && <span className="text-xs font-mono">{userReactions.size}</span>}
                <span className="text-xs font-mono hidden sm:inline">{userReactions.size > 0 ? '' : 'React'}</span>
            </button>

            {/* Popover Menu */}
            <div className={cn(
                "absolute left-0 bottom-full mb-2 p-2 bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex gap-1 z-50 transition-all duration-200 origin-bottom-left min-w-max",
                isOpen || isHovering ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
            )}>
                {reactionTypes.map((type) => {
                    const isActive = userReactions.has(type);
                    return (
                        <button
                            key={type}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(type); }}
                            className={cn(
                                "group relative p-2 rounded-lg hover:bg-white/10 transition-colors flex flex-col items-center justify-center min-w-[36px]",
                                isActive && "bg-emerald-500/20 ring-1 ring-emerald-500/50"
                            )}
                        >
                            <span className="text-xl leading-none mb-0.5 transform group-hover:scale-110 transition-transform block">
                                {REACTION_EMOJIS[type]}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-black/90 border border-white/10 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-xl backdrop-blur-sm">
                                <span className="font-bold block text-sme-gold mb-0.5">{REACTION_LABELS[type]}</span>
                                <span className="opacity-80 block max-w-[150px] whitespace-normal leading-tight">{REACTION_DESCRIPTIONS[type]}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
