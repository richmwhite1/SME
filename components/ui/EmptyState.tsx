"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    primaryCTA?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    secondaryCTA?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    variant?: "default" | "encouraging" | "celebration";
    className?: string;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    primaryCTA,
    secondaryCTA,
    variant = "default",
    className = "",
}: EmptyStateProps) {
    const variantStyles = {
        default: {
            container: "border-bone-white/10",
            icon: "text-bone-white/40",
            title: "text-bone-white/70",
            description: "text-bone-white/50",
        },
        encouraging: {
            container: "border-emerald-500/20 bg-emerald-500/5",
            icon: "text-emerald-400/60",
            title: "text-emerald-300/90",
            description: "text-bone-white/60",
        },
        celebration: {
            container: "border-sme-gold/20 bg-sme-gold/5",
            icon: "text-sme-gold/60",
            title: "text-sme-gold/90",
            description: "text-bone-white/60",
        },
    };

    const styles = variantStyles[variant];

    return (
        <div
            className={`flex flex-col items-center justify-center py-16 px-6 border rounded-lg ${styles.container} ${className} animate-fadeIn`}
        >
            {/* Icon */}
            <div className="mb-6">
                <Icon size={64} className={`${styles.icon} transition-all duration-300`} strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h3 className={`text-xl font-serif mb-3 text-center ${styles.title}`}>
                {title}
            </h3>

            {/* Description */}
            <p className={`text-sm text-center max-w-md mb-8 leading-relaxed ${styles.description}`}>
                {description}
            </p>

            {/* CTAs */}
            {(primaryCTA || secondaryCTA) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {primaryCTA && (
                        primaryCTA.href ? (
                            <Link
                                href={primaryCTA.href}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm rounded transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                {primaryCTA.label}
                            </Link>
                        ) : (
                            <button
                                onClick={primaryCTA.onClick}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm rounded transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                {primaryCTA.label}
                            </button>
                        )
                    )}

                    {secondaryCTA && (
                        secondaryCTA.href ? (
                            <Link
                                href={secondaryCTA.href}
                                className="px-6 py-3 border border-bone-white/20 hover:border-bone-white/40 text-bone-white/80 hover:text-bone-white font-mono text-sm rounded transition-all duration-200"
                            >
                                {secondaryCTA.label}
                            </Link>
                        ) : (
                            <button
                                onClick={secondaryCTA.onClick}
                                className="px-6 py-3 border border-bone-white/20 hover:border-bone-white/40 text-bone-white/80 hover:text-bone-white font-mono text-sm rounded transition-all duration-200"
                            >
                                {secondaryCTA.label}
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
