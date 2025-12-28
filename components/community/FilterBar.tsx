"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

const MASTER_TOPICS = [
    "Biohacking", "Longevity", "Research", "Supplements",
    "Nutrition", "Wellness", "Gut Health", "Mental Health",
    "Fitness", "Sleep", "Hormones", "Prevention"
];

export default function FilterBar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [pillarOpen, setPillarOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Parse pillars from comma-separated string
    const currentPillars = searchParams.get("pillars")?.split(",").filter(Boolean) || [];
    const currentFilter = searchParams.get("filter") || "all";

    function setFilter(filter: string) {
        const params = new URLSearchParams(searchParams);
        if (filter === "all") {
            params.delete("filter");
        } else {
            params.set("filter", filter);
        }
        replace(`${pathname}?${params.toString()}`);
    }

    function togglePillar(pillar: string) {
        const params = new URLSearchParams(searchParams);
        let newPillars = [...currentPillars];

        if (newPillars.includes(pillar)) {
            newPillars = newPillars.filter(p => p !== pillar);
        } else {
            newPillars.push(pillar);
        }

        if (newPillars.length > 0) {
            params.set("pillars", newPillars.join(","));
        } else {
            params.delete("pillars");
        }
        replace(`${pathname}?${params.toString()}`);
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setPillarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-translucent-emerald/50 pb-4">
            <div className="flex">
                <FilterButton
                    active={currentFilter === "all"}
                    onClick={() => setFilter("all")}
                >
                    Show All
                </FilterButton>
                <FilterButton
                    active={currentFilter === "sme"}
                    onClick={() => setFilter("sme")}
                >
                    SMEs Only
                </FilterButton>
                <FilterButton
                    active={currentFilter === "following"}
                    onClick={() => setFilter("following")}
                >
                    Following
                </FilterButton>
            </div>

            {/* Pillar Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setPillarOpen(!pillarOpen)}
                    className={cn(
                        "flex items-center gap-2 rounded border px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors",
                        currentPillars.length > 0
                            ? "border-heart-green text-heart-green bg-heart-green/10"
                            : "border-translucent-emerald text-bone-white/70 hover:text-bone-white hover:border-bone-white/40"
                    )}
                >
                    <span>Filter by Pillar {currentPillars.length > 0 && `(${currentPillars.length})`}</span>
                    <ChevronDown size={14} className={cn("transition-transform", pillarOpen && "rotate-180")} />
                </button>

                {pillarOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-translucent-emerald bg-forest-obsidian/95 p-2 shadow-xl backdrop-blur-md z-10">
                        <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
                            {MASTER_TOPICS.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => togglePillar(topic)}
                                    className={cn(
                                        "flex items-center justify-between rounded px-3 py-2 text-left text-xs font-mono transition-colors",
                                        currentPillars.includes(topic)
                                            ? "bg-heart-green text-forest-obsidian"
                                            : "text-bone-white/70 hover:bg-muted-moss hover:text-bone-white"
                                    )}
                                >
                                    <span>{topic}</span>
                                    {currentPillars.includes(topic) && <X size={12} />}
                                </button>
                            ))}
                        </div>
                        {currentPillars.length > 0 && (
                            <div className="mt-2 border-t border-translucent-emerald pt-2">
                                <button
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams);
                                        params.delete("pillars");
                                        replace(`${pathname}?${params.toString()}`);
                                        setPillarOpen(false);
                                    }}
                                    className="w-full rounded bg-muted-moss/50 py-1.5 text-center text-xs text-bone-white/60 hover:text-red-400"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-6 py-2 text-sm font-medium transition-colors font-mono relative",
                active ? "text-heart-green" : "text-bone-white/60 hover:text-bone-white"
            )}
        >
            {children}
            {active && (
                <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-heart-green" />
            )}
        </button>
    );
}
