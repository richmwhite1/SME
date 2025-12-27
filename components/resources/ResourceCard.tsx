
"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, ExternalLink, MessageSquare, FlaskConical, FileText, ClipboardList, Paperclip, ArrowUp, Hand } from "lucide-react";
import TopicBadge from "@/components/topics/TopicBadge";

interface Resource {
    origin_type: "Product" | "Discussion";
    origin_id: string;
    origin_slug: string;
    title: string;
    reference_url: string;
    created_at: string | null;
    author_name: string | null;
    author_username: string | null;
    tags?: string[] | null;
    images?: string[] | null;
    is_sme_certified?: boolean;
    third_party_lab_verified?: boolean;
    hasVerifiedCOA?: boolean;
    sourceType?: "Lab Report" | "Clinical Research" | "Product Audit" | "Field Notes" | null;
    // Counts (Optional for now, will implement later)
    upvote_count?: number;
    comment_count?: number;
    raise_hand_count?: number;
}

interface ResourceCardProps {
    resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
    const isVerified = resource.is_sme_certified || resource.third_party_lab_verified || resource.hasVerifiedCOA;
    const formattedDate = resource.created_at ? formatDistanceToNow(new Date(resource.created_at), { addSuffix: true }) : null;

    const getSourceIcon = (sourceType?: string | null) => {
        switch (sourceType) {
            case "Lab Report":
                return <FlaskConical className="h-3.5 w-3.5 text-sme-gold" />;
            case "Clinical Research":
                return <FileText className="h-3.5 w-3.5 text-heart-green" />;
            case "Product Audit":
                return <ClipboardList className="h-3.5 w-3.5 text-third-eye-indigo" />;
            case "Field Notes":
                return <MessageSquare className="h-3.5 w-3.5 text-bone-white" />;
            default:
                return <Paperclip className="h-3.5 w-3.5 text-bone-white/50" />;
        }
    };

    const upvoteCount = resource.upvote_count || 0;
    const commentCount = resource.comment_count || 0;
    const handCount = resource.raise_hand_count || 0;

    return (
        <div className="group relative border border-translucent-emerald bg-muted-moss transition-all hover:border-heart-green hover:shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)]">

            {/* Category Badge (Top Right) */}
            <div className="absolute top-0 right-0 z-10">
                <div className="bg-forest-obsidian/90 backdrop-blur border-l border-b border-translucent-emerald px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-bone-white/70">
                    {resource.tags && resource.tags.length > 0 ? resource.tags[0] : (resource.sourceType || "General")}
                </div>
            </div>

            <div className="p-4 pt-8"> {/* Added pt-8 for badge space */}
                <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                        {resource.images && resource.images.length > 0 ? (
                            <div className="relative h-20 w-20 overflow-hidden border border-translucent-emerald bg-forest-obsidian rounded-sm">
                                <Image
                                    src={resource.images[0]}
                                    alt={resource.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center border border-translucent-emerald bg-forest-obsidian text-bone-white/30 rounded-sm">
                                {resource.origin_type === "Product" ? <BookOpen size={24} /> : <MessageSquare size={24} />}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Meta Top */}
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            {getSourceIcon(resource.sourceType)}
                            <span className="text-[10px] font-mono uppercase tracking-wider text-bone-white/50">
                                {resource.sourceType || resource.origin_type}
                            </span>
                            {isVerified && (
                                <span className="flex items-center gap-1 border border-sme-gold bg-sme-gold/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-sme-gold">
                                    Verified
                                </span>
                            )}
                            <span className="text-[10px] text-bone-white/30 font-mono ml-auto">
                                {formattedDate}
                            </span>
                        </div>

                        <h3 className="mb-2 font-serif text-lg font-bold text-bone-white leading-tight group-hover:text-heart-green transition-colors">
                            {resource.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-bone-white/60 font-mono mb-4">
                            {resource.author_name && (
                                <span>by <span className="text-bone-white/80">{resource.author_name}</span></span>
                            )}
                            <a
                                href={resource.reference_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-heart-green/80 hover:text-heart-green ml-auto hover:underline"
                            >
                                <ExternalLink size={10} />
                                Source
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-translucent-emerald/50 bg-forest-obsidian/30 px-4 py-2">
                <div className="flex items-center gap-4">
                    {/* Upvote */}
                    <button className="flex items-center gap-1.5 text-bone-white/40 hover:text-heart-green transition-colors group/action">
                        <ArrowUp size={14} className="group-hover/action:-translate-y-0.5 transition-transform" />
                        <span className="text-xs font-mono">{upvoteCount > 0 ? upvoteCount : "Vote"}</span>
                    </button>

                    {/* Comment */}
                    <Link
                        href={resource.origin_type === "Product" ? `/products/${resource.origin_id}` : `/discussions/${resource.origin_id}`}
                        className="flex items-center gap-1.5 text-bone-white/40 hover:text-bone-white transition-colors group/action"
                    >
                        <MessageSquare size={14} className="group-hover/action:scale-105 transition-transform" />
                        <span className="text-xs font-mono">{commentCount > 0 ? commentCount : "Discussion"}</span>
                    </Link>

                    {/* Raise Hand */}
                    <button className="flex items-center gap-1.5 text-bone-white/40 hover:text-sme-gold transition-colors group/action">
                        <Hand size={14} className="group-hover/action:-rotate-12 transition-transform" />
                        <span className="text-xs font-mono">{handCount > 0 ? handCount : "Audit"}</span>
                    </button>
                </div>

                <Link
                    href={resource.origin_type === "Product" ? `/products/${resource.origin_id}` : `/discussions/${resource.origin_id}`}
                    className="text-[10px] font-mono uppercase tracking-wider text-bone-white/40 hover:text-heart-green transition-colors"
                >
                    View Details →
                </Link>
            </div>
        </div>
    );
}
