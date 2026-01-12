"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VoteButtonProps {
    voteCount: number;
    userVote?: "up" | "down" | null;
    onUpvote: () => void;
    onDownvote: () => void;
    size?: "sm" | "md" | "lg";
    orientation?: "horizontal" | "vertical";
    disabled?: boolean;
}

export default function VoteButton({
    voteCount,
    userVote,
    onUpvote,
    onDownvote,
    size = "md",
    orientation = "vertical",
    disabled = false,
}: VoteButtonProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

    const sizeClasses = {
        sm: { button: "p-1", icon: 14, text: "text-xs" },
        md: { button: "p-2", icon: 18, text: "text-sm" },
        lg: { button: "p-3", icon: 22, text: "text-base" },
    };

    const currentSize = sizeClasses[size];

    const handleUpvote = () => {
        if (disabled) return;

        setIsAnimating(true);
        onUpvote();

        // Create particle effect for upvote
        const newParticles = Array.from({ length: 5 }, (_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 40 - 20,
            y: Math.random() * -30 - 10,
        }));
        setParticles(newParticles);

        setTimeout(() => {
            setIsAnimating(false);
            setParticles([]);
        }, 600);
    };

    const handleDownvote = () => {
        if (disabled) return;
        setIsAnimating(true);
        onDownvote();
        setTimeout(() => setIsAnimating(false), 300);
    };

    const containerClass = orientation === "vertical"
        ? "flex flex-col items-center gap-1"
        : "flex flex-row items-center gap-2";

    return (
        <div className={`relative ${containerClass}`}>
            {/* Upvote Button */}
            <button
                onClick={handleUpvote}
                disabled={disabled}
                className={`
          ${currentSize.button}
          rounded transition-all duration-200
          ${userVote === "up"
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                        : "text-bone-white/60 hover:text-emerald-400 hover:bg-emerald-600/10 border border-transparent hover:border-emerald-500/20"
                    }
          ${isAnimating && userVote === "up" ? "animate-vote-bounce" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          relative
        `}
                aria-label="Upvote"
            >
                <ChevronUp size={currentSize.icon} strokeWidth={2.5} />
            </button>

            {/* Vote Count */}
            <span
                className={`
          ${currentSize.text} 
          font-mono font-bold
          ${voteCount > 0 ? "text-emerald-400" : voteCount < 0 ? "text-red-400" : "text-bone-white/50"}
          transition-colors duration-200
        `}
            >
                {voteCount > 0 ? `+${voteCount}` : voteCount}
            </span>

            {/* Downvote Button */}
            <button
                onClick={handleDownvote}
                disabled={disabled}
                className={`
          ${currentSize.button}
          rounded transition-all duration-200
          ${userVote === "down"
                        ? "bg-red-600/20 text-red-400 border border-red-500/30"
                        : "text-bone-white/60 hover:text-red-400 hover:bg-red-600/10 border border-transparent hover:border-red-500/20"
                    }
          ${isAnimating && userVote === "down" ? "animate-vote-bounce" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
                aria-label="Downvote"
            >
                <ChevronDown size={currentSize.icon} strokeWidth={2.5} />
            </button>

            {/* Particle Effects */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute pointer-events-none"
                    style={{
                        left: "50%",
                        top: "0%",
                        transform: `translate(${particle.x}px, ${particle.y}px)`,
                    }}
                >
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-particle-burst opacity-0" />
                </div>
            ))}
        </div>
    );
}
