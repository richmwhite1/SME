"use client";

import { useState, useRef, useEffect } from "react";
import { toggleReaction, ReactionType, ResourceType } from "@/app/actions/reaction-actions";
import { cn } from "@/lib/utils";
import { SmilePlus } from "lucide-react";

interface ReactionBarProps {
    resourceId: string;
    resourceType: ResourceType;
    initialUserReactions?: ReactionType[]; // Emojis user has selected
}

const TRUTH_SIGNALS: { emoji: ReactionType; label: string; description: string }[] = [
    { emoji: "🧐", label: "Curious", description: "Interesting, needs more info" },
    { emoji: "⚠️", label: "Dangerous", description: "Potential safety concern" },
    { emoji: "🎯", label: "Spot On", description: "Accurate and precise" },
    { emoji: "✅", label: "Verifying", description: "I can vouch for this" },
    { emoji: "🧬", label: "Science", description: "Backed by biology" },
    { emoji: "🔬", label: "Citations", description: "Requesting documentation" },
];

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

    const handleToggle = async (emoji: ReactionType) => {
        const newSet = new Set(userReactions);
        const isActive = newSet.has(emoji);

        if (isActive) {
            newSet.delete(emoji);
        } else {
            newSet.add(emoji);
        }

        setUserReactions(newSet);

        try {
            await toggleReaction(resourceId, resourceType, emoji);
            // We don't block UI on server response for reactions usually
        } catch (error) {
            console.error("Reaction failed", error);
            // Revert?
            if (isActive) newSet.add(emoji); else newSet.delete(emoji);
            setUserReactions(new Set(newSet));
        }
    };

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
                    (isOpen || isHovering) ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-400" : "bg-transparent border-transparent text-bone-white/40 hover:text-bone-white/80"
                )}
                title="Add Reaction"
            >
                <SmilePlus size={16} />
                <span className="text-xs font-mono hidden sm:inline">React</span>
            </button>

            {/* Popover Menu */}
            <div className={cn(
                "absolute left-0 bottom-full mb-2 p-2 bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex gap-1 z-50 transition-all duration-200 origin-bottom-left",
                isOpen || isHovering ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
            )}>
                {TRUTH_SIGNALS.map((signal) => {
                    const isActive = userReactions.has(signal.emoji);
                    return (
                        <button
                            key={signal.emoji}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(signal.emoji); }}
                            className={cn(
                                "group relative p-2 rounded-lg hover:bg-white/10 transition-colors flex flex-col items-center justify-center min-w-[36px]",
                                isActive && "bg-emerald-500/20 ring-1 ring-emerald-500/50"
                            )}
                        >
                            <span className="text-xl leading-none mb-0.5 transform group-hover:scale-110 transition-transform block">
                                {signal.emoji}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                <span className="font-bold block">{signal.label}</span>
                                <span className="opacity-70">{signal.description}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
