"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, ExternalLink } from "lucide-react";

interface StickyCTABarProps {
    buyUrl: string;
    productTitle: string;
    discountCode?: string | null;
    isVisible: boolean;
}

export default function StickyCTABar({ buyUrl, productTitle, discountCode, isVisible }: StickyCTABarProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show sticky bar after scrolling past 400px (roughly past the hero section)
            const scrollPosition = window.scrollY;
            setShow(scrollPosition > 400);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Only show on mobile (hidden on md and up)
    if (!isVisible || !show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-forest-obsidian/95 backdrop-blur-lg border-t-2 border-emerald-500/50 shadow-2xl shadow-emerald-900/50 animate-slide-up">
            <div className="px-4 py-3">
                <a
                    href={buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                        flex items-center justify-center gap-3
                        w-full px-6 py-4
                        bg-gradient-to-r from-emerald-600 to-emerald-700
                        hover:from-emerald-500 hover:to-emerald-600
                        active:scale-95
                        text-white font-bold text-base uppercase tracking-wider
                        rounded-lg
                        shadow-lg shadow-emerald-900/50
                        transition-all duration-200
                        border-2 border-emerald-500/50
                        min-h-[44px]
                    "
                    aria-label={`Buy ${productTitle}`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    Buy It Now
                    <ExternalLink className="w-4 h-4" />
                </a>
                {discountCode && (
                    <p className="text-center text-xs text-emerald-400 mt-2 font-mono">
                        Discount code available above ↑
                    </p>
                )}
            </div>
        </div>
    );
}
