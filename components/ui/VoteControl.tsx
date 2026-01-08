"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { toggleVote, VoteType, ResourceType } from "@/app/actions/vote-actions";
import { cn } from "@/lib/utils"; // Assuming utils exists, or I'll check. Usually standard nextjs.

interface VoteControlProps {
    resourceId: string;
    resourceType: ResourceType;
    initialUpvoteCount: number;
    initialUserVote?: VoteType | null; // 1, -1, or null
    orientation?: "vertical" | "horizontal";
    size?: "sm" | "md" | "lg";
}

export default function VoteControl({
    resourceId,
    resourceType,
    initialUpvoteCount,
    initialUserVote = null,
    orientation = "horizontal",
    size = "sm"
}: VoteControlProps) {
    const [score, setScore] = useState(initialUpvoteCount);
    const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);
    const [isVoting, setIsVoting] = useState(false);

    const handleVote = async (type: VoteType) => {
        if (isVoting) return;

        // Prevent double clicking same vote to toggle off if we want that behavior?
        // Reddit: Clicking Up when Up removes Up. 
        // Logic: 
        // Current=Null, Click=Up -> Vote=Up, Score+=1
        // Current=Up, Click=Up -> Vote=Null, Score-=1
        // Current=Down, Click=Up -> Vote=Up, Score+=2

        const previousVote = userVote;
        const previousScore = score;

        let newVote: VoteType | null = type;
        let newScore = score;

        if (userVote === type) {
            // Toggle off
            newVote = null;
            newScore -= type;
        } else {
            // Switch or New
            newVote = type;
            if (userVote === null) {
                newScore += type;
            } else {
                // Switching from -1 to 1 => +2
                // Switching from 1 to -1 => -2
                newScore += (type * 2);
            }
        }

        // Optimistic Update
        setUserVote(newVote);
        setScore(newScore);
        setIsVoting(true);

        try {
            const result = await toggleVote(resourceId, resourceType, type);
            if (result.success) {
                // Update with server truth if available, or keep optimistic
                if (result.voteType !== undefined) setUserVote(result.voteType);
                if (result.score !== undefined) setScore(result.score);
            } else {
                // Revert
                setUserVote(previousVote);
                setScore(previousScore);
                console.error("Vote failed:", result.error);
            }
        } catch (error) {
            setUserVote(previousVote);
            setScore(previousScore);
            console.error("Vote error:", error);
        } finally {
            setIsVoting(false);
        }
    };

    const isVertical = orientation === "vertical";
    const iconSize = size === "sm" ? 14 : (size === "lg" ? 22 : 18);
    const textSize = size === "sm" ? "text-xs" : (size === "lg" ? "text-base" : "text-sm");

    return (
        <div className={cn(
            "flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5",
            isVertical ? "flex-col" : "flex-row"
        )}>
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(1); }}
                disabled={isVoting}
                className={cn(
                    "p-1 rounded hover:bg-white/10 transition-colors",
                    userVote === 1 ? "text-sme-gold" : "text-bone-white/40 hover:text-sme-gold/70"
                )}
                title="Upvote"
            >
                <ArrowUp size={iconSize} className={cn(userVote === 1 && "fill-current")} />
            </button>

            <span className={cn(
                "font-mono font-bold text-bone-white min-w-[20px] text-center",
                textSize,
                userVote === 1 && "text-sme-gold",
                userVote === -1 && "text-red-400"
            )}>
                {score}
            </span>

            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(-1); }}
                disabled={isVoting}
                className={cn(
                    "p-1 rounded hover:bg-white/10 transition-colors",
                    userVote === -1 ? "text-red-400" : "text-bone-white/40 hover:text-red-400/70"
                )}
                title="Downvote"
            >
                <ArrowDown size={iconSize} className={cn(userVote === -1 && "fill-current")} />
            </button>
        </div>
    );
}
