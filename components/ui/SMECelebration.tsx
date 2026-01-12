"use client";

import { useEffect, useState } from "react";
import { Award, X, Share2 } from "lucide-react";

interface SMECelebrationProps {
    smeType: "scientific" | "experiential" | "both";
    onClose: () => void;
    userName?: string;
}

export default function SMECelebration({
    smeType,
    onClose,
    userName = "You",
}: SMECelebrationProps) {
    const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Generate confetti
        const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.5,
            duration: 2 + Math.random() * 2,
        }));
        setConfetti(confettiPieces);

        // Show content after brief delay
        setTimeout(() => setShowContent(true), 100);
    }, []);

    const typeConfig = {
        scientific: {
            title: "Scientific SME Certified! 🔬",
            color: "from-blue-500 to-cyan-500",
            borderColor: "border-blue-500/30",
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-400",
            description: "Your research-backed contributions have earned you Scientific SME status.",
        },
        experiential: {
            title: "Experiential SME Certified! ⭐",
            color: "from-amber-500 to-orange-500",
            borderColor: "border-amber-500/30",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-400",
            description: "Your real-world insights have earned you Experiential SME status.",
        },
        both: {
            title: "Dual SME Certified! 🏆",
            color: "from-purple-500 via-pink-500 to-amber-500",
            borderColor: "border-purple-500/30",
            bgColor: "bg-gradient-to-r from-purple-500/10 to-amber-500/10",
            textColor: "text-purple-400",
            description: "You've mastered both scientific rigor and experiential wisdom!",
        },
    };

    const config = typeConfig[smeType];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            {/* Confetti */}
            {confetti.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute top-0 w-2 h-2 rounded-full animate-confetti"
                    style={{
                        left: `${piece.left}%`,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                        backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    }}
                />
            ))}

            {/* Content Card */}
            <div
                className={`
          relative max-w-lg w-full mx-4 p-8 
          bg-forest-obsidian border ${config.borderColor} rounded-lg
          transform transition-all duration-500
          ${showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"}
        `}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-bone-white/50 hover:text-bone-white transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Badge Icon with Animation */}
                <div className="flex justify-center mb-6">
                    <div className={`relative p-6 rounded-full bg-gradient-to-br ${config.color} animate-badge-reveal`}>
                        <Award size={64} className="text-white" strokeWidth={2} />

                        {/* Pulse rings */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-50 animate-ping" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-30 animate-pulse" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-serif text-center mb-4 bg-gradient-to-r ${config.color} bg-clip-text text-transparent">
                    {config.title}
                </h2>

                {/* Description */}
                <p className="text-center text-bone-white/70 mb-6 leading-relaxed">
                    {config.description}
                </p>

                {/* Stats/Benefits */}
                <div className={`p-4 ${config.bgColor} border ${config.borderColor} rounded mb-6`}>
                    <p className="text-sm text-bone-white/80 text-center mb-2 font-mono">
                        <span className="font-bold">New Privileges Unlocked:</span>
                    </p>
                    <ul className="text-xs text-bone-white/60 space-y-1">
                        <li>✓ Your reviews carry more weight in consensus scores</li>
                        <li>✓ SME badge displayed on all your contributions</li>
                        <li>✓ Access to exclusive SME-only discussions</li>
                        <li>✓ Priority in community moderation</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm rounded transition-all duration-200 hover:scale-105"
                    >
                        Start Contributing
                    </button>
                    <button
                        onClick={() => {
                            // TODO: Implement share functionality
                            console.log("Share SME achievement");
                        }}
                        className="px-4 py-3 border border-bone-white/20 hover:border-bone-white/40 text-bone-white/80 hover:text-bone-white rounded transition-all duration-200"
                        aria-label="Share achievement"
                    >
                        <Share2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
