"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecommendedUsers, followUsers, updateUserPillars } from "@/app/actions/onboarding";
import { CommunityUser } from "@/app/actions/community";
import Image from "next/image";

const MASTER_TOPICS = [
    "Biohacking", "Longevity", "Research", "Supplements",
    "Nutrition", "Wellness", "Gut Health", "Mental Health",
    "Fitness", "Sleep", "Hormones", "Prevention"
];

export default function UserOnboardingPage() {
    const [step, setStep] = useState(1);
    const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
    const [recommendations, setRecommendations] = useState<CommunityUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const router = useRouter();

    const togglePillar = (pillar: string) => {
        if (selectedPillars.includes(pillar)) {
            setSelectedPillars(prev => prev.filter(p => p !== pillar));
        } else {
            if (selectedPillars.length >= 3) return; // Max 3
            setSelectedPillars(prev => [...prev, pillar]);
        }
    };

    const handlePillarSubmit = async () => {
        setLoading(true);
        try {
            // Save pillars to profile
            await updateUserPillars(selectedPillars);

            // Fetch recommendations
            const recs = await getRecommendedUsers(selectedPillars);
            setRecommendations(recs);
            setFollowingIds(recs.map(u => u.id)); // Default follow all
            setStep(2);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleFollow = (id: string) => {
        if (followingIds.includes(id)) {
            setFollowingIds(prev => prev.filter(i => i !== id));
        } else {
            setFollowingIds(prev => [...prev, id]);
        }
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            await followUsers(followingIds);
            router.push("/feed"); // Or /community
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-forest-obsidian flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-muted-moss/20 border border-translucent-emerald rounded-lg p-8 shadow-2xl">

                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="font-serif text-3xl font-bold text-bone-white mb-2">
                        {step === 1 ? "Choose Your Path" : "Build Your Circle"}
                    </h1>
                    <p className="text-bone-white/60 font-mono text-sm max-w-md mx-auto">
                        {step === 1
                            ? "Select 3 pillars of health you are most interested in optimizing."
                            : "We found these verified experts based on your interests."
                        }
                    </p>
                </div>

                {/* Step 1: Pillars */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {MASTER_TOPICS.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => togglePillar(topic)}
                                    disabled={!selectedPillars.includes(topic) && selectedPillars.length >= 3}
                                    className={cn(
                                        "p-4 rounded border text-sm font-medium transition-all text-center",
                                        selectedPillars.includes(topic)
                                            ? "bg-heart-green text-forest-obsidian border-heart-green shadow-[0_0_15px_rgba(34,139,34,0.4)]"
                                            : "bg-forest-obsidian border-translucent-emerald text-bone-white/60 hover:text-bone-white hover:border-bone-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {topic}
                                    {selectedPillars.includes(topic) && (
                                        <div className="mt-1 flex justify-center"><Check size={14} /></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handlePillarSubmit}
                                disabled={selectedPillars.length < 1 || loading}
                                className="flex items-center gap-2 rounded-full bg-sme-gold px-8 py-3 text-sm font-bold text-forest-obsidian transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Continue"}
                                {!loading && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Recommendations */}
                {step === 2 && (
                    <div className="space-y-8">
                        <div className="space-y-3">
                            {recommendations.length > 0 ? (
                                recommendations.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 rounded bg-forest-obsidian/50 border border-translucent-emerald">
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-translucent-emerald">
                                                <Image src={user.avatar_url || "/placeholder-avatar.png"} alt={user.username || "User"} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-bone-white text-sm">{user.full_name}</div>
                                                <div className="text-xs text-bone-white/60">{user.profession}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleFollow(user.id)}
                                            className={cn(
                                                "px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors",
                                                followingIds.includes(user.id)
                                                    ? "bg-heart-green text-forest-obsidian"
                                                    : "border border-translucent-emerald text-bone-white/60"
                                            )}
                                        >
                                            {followingIds.includes(user.id) ? "Following" : "Follow"}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-bone-white/50 py-8">No specific recommendations found. You can always explore the community directly.</p>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => router.push("/feed")}
                                className="px-6 py-3 text-sm text-bone-white/50 hover:text-bone-white"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleFinalSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-full bg-sme-gold px-8 py-3 text-sm font-bold text-forest-obsidian transition-transform hover:scale-105 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Finish"}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
