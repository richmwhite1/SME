import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import VoteControl from "@/components/ui/VoteControl";

interface DossierHeaderProps {
    title: string;
    brand: string;
    consensusScore: number;
    image?: string;
    productId: string; // New prop
    upvoteCount?: number; // New prop
}

export default function DossierHeader({
    title,
    brand,
    consensusScore,
    image,
    productId,
    upvoteCount = 0
}: DossierHeaderProps) {
    // Determine score color
    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-emerald-400 border-emerald-400";
        if (score >= 70) return "text-emerald-200 border-emerald-200";
        if (score >= 50) return "text-yellow-200 border-yellow-200";
        return "text-red-300 border-red-300";
    };

    const scoreColorClass = getScoreColor(consensusScore);

    return (
        <div className="w-full mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    {/* Vote Control - Placed prominently */}
                    <VoteControl
                        resourceId={productId}
                        resourceType="product"
                        initialUpvoteCount={upvoteCount}
                        orientation="vertical"
                        size="md"
                    />

                    {/* Product Image Thumbnail if available */}
                    {image && (
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            <Image
                                src={image}
                                alt={title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    <div>
                        <div className="mb-2">
                            <span className="text-xs font-mono uppercase tracking-wider text-white/50 bg-white/5 px-2 py-1 rounded">
                                Dossier View
                            </span>
                        </div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-1">
                            {title}
                        </h1>
                        <p className="font-mono text-sm text-white/60 uppercase tracking-widest">
                            {brand}
                        </p>
                    </div>
                </div>

                {/* Community Consensus Score Badge */}
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-right">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">
                            Community Consensus
                        </div>
                        <div className="text-xs text-white/40">
                            Trust Score
                        </div>
                    </div>
                    <div className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${scoreColorClass} bg-black/20 backdrop-blur-sm`}>
                        <span className={`font-mono text-2xl font-bold ${scoreColorClass.split(' ')[0]}`}>
                            {consensusScore}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
