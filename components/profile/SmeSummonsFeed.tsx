"use client";

import Link from "next/link";
import { SmeSummons } from "@/app/actions/sme-actions";
import { MessageSquare, AlertCircle } from "lucide-react";
import Image from "next/image";

interface SmeSummonsFeedProps {
    summons: SmeSummons[];
}

export default function SmeSummonsFeed({ summons }: SmeSummonsFeedProps) {
    if (!summons || summons.length === 0) {
        return null;
    }

    const getLensIcon = (lens: string) => {
        switch (lens.toLowerCase()) {
            case "scientific":
                return "🧬";
            case "ancestral":
                return "🪵";
            case "esoteric":
                return "👁️";
            default:
                return "🔍";
        }
    };

    return (
        <div className="mb-8 overflow-hidden border border-sme-gold/50 bg-forest-obsidian shadow-2xl">
            <div className="border-b border-sme-gold/30 bg-gradient-to-r from-sme-gold/10 to-transparent p-4 flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h2 className="font-serif text-lg font-bold text-sme-gold">
                    SME Summons
                    <span className="ml-2 text-xs font-mono font-normal uppercase tracking-wider text-sme-gold/70">
                        For Verified Eyes Only
                    </span>
                </h2>
            </div>

            <div className="divide-y divide-translucent-emerald">
                {summons.map((item) => (
                    <div key={item.id} className="group relative p-4 transition-colors hover:bg-muted-moss/30 p-[2px]">
                        {/* Priority Badge */}
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {item.priority >= 4 ? (
                                    <span className="flex items-center gap-1 rounded bg-red-900/40 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-800/50">
                                        <span className="animate-pulse">🔥</span> High Priority
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded bg-yellow-900/40 px-2 py-0.5 text-xs font-bold text-yellow-400 border border-yellow-800/50">
                                        ⚠️ Review Needed
                                    </span>
                                )}

                                <span className="flex items-center gap-1 rounded bg-forest-obsidian px-2 py-0.5 text-xs font-mono text-bone-white border border-translucent-emerald">
                                    {getLensIcon(item.lens)} {item.lens} Lens Requested
                                </span>
                            </div>

                            {item.red_flags_count > 0 && (
                                <div className="flex items-center gap-1 text-xs text-red-300 font-mono">
                                    <AlertCircle size={12} />
                                    {item.red_flags_count} Red Flags
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-translucent-emerald">
                                {item.product_image ? (
                                    <Image
                                        src={item.product_image}
                                        alt={item.product_title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-muted-moss text-2xl">
                                        💊
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <Link href={`/products/${item.product_slug}`} className="block">
                                    <h3 className="font-serif text-lg font-semibold text-bone-white group-hover:text-heart-green transition-colors">
                                        {item.product_title}
                                    </h3>
                                </Link>
                                <div className="mt-2 flex items-center gap-4">
                                    <Link
                                        href={`/products/${item.product_slug}#comments`}
                                        className="inline-flex items-center gap-2 rounded bg-sme-gold px-4 py-1.5 text-xs font-bold text-forest-obsidian hover:bg-yellow-400 transition-colors"
                                    >
                                        Weigh In <MessageSquare size={12} />
                                    </Link>
                                    <span className="text-xs text-sme-gold/80 italic">
                                        ✨ Double Reputation Points Waiting
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
