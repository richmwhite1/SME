"use client";

import Link from "next/link";
import { MessageSquare, BookOpen, TrendingUp, Award, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import TopicBadge from "@/components/topics/TopicBadge";
import FeedItemCard from "@/components/feed/FeedItemCard";
import FeedRefresher from "@/components/feed/FeedRefresher";

interface FeedContentProps {
    activeThreads: any[];
    followedSignalItems: any[];
    trackedSMEItems: any[];
    trustTrendItem: any | null;
    followedTopics: string[];
}

export default function FeedContent({
    activeThreads,
    followedSignalItems,
    trackedSMEItems,
    trustTrendItem,
    followedTopics,
}: FeedContentProps) {
    return (
        <>
            {/* Feed Refresher - Shows when new signals are detected */}
            <FeedRefresher
                initialItemCount={
                    activeThreads.length +
                    trackedSMEItems.length +
                    followedSignalItems.length +
                    (trustTrendItem ? 1 : 0)
                }
                initialTimestamp={new Date().toISOString()}
                followedTopics={followedTopics}
            />

            {/* Active Threads */}
            {activeThreads.length > 0 && (
                <section className="mb-8 border border-translucent-emerald bg-muted-moss p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-third-eye-indigo" />
                        <h2 className="font-serif text-xl font-semibold text-bone-white">Active Threads</h2>
                    </div>
                    <p className="mb-4 text-xs text-bone-white/70 font-mono">
                        Discussions you&apos;ve commented on with new replies
                    </p>
                    <div className="space-y-3">
                        {activeThreads.slice(0, 5).map((thread) => (
                            <Link
                                key={thread.discussion_id}
                                href={`/discussions/${thread.discussion_id}`}
                                className="block border border-translucent-emerald bg-forest-obsidian p-4 transition-all duration-300 hover:border-heart-green active:scale-95"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="mb-1 font-serif text-base font-semibold text-bone-white truncate">
                                            {thread.discussion_title}
                                        </h3>
                                        <div className="mb-2 flex items-center gap-2 text-xs text-bone-white/70 font-mono">
                                            <span>
                                                {thread.reply_count} new {thread.reply_count === 1 ? "reply" : "replies"}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {formatDistanceToNow(new Date(thread.last_reply_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {thread.tags && thread.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {thread.tags.slice(0, 3).map((tag: string) => (
                                                    <TopicBadge key={tag} topic={tag} clickable={true} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-bone-white/50 flex-shrink-0" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Tracked SME Intelligence */}
            {trackedSMEItems.length > 0 && (
                <section className="mb-8 border border-sme-gold/30 bg-muted-moss p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-sme-gold" />
                        <h2 className="font-serif text-xl font-semibold text-bone-white">Tracked Signal</h2>
                    </div>
                    <p className="mb-4 text-xs text-bone-white/70 font-mono">
                        New discussions and SME Citations contributions from tracked SMEs
                    </p>
                    <div className="space-y-3">
                        {trackedSMEItems.slice(0, 10).map((item) => (
                            <FeedItemCard key={`sme-${item.type}-${item.id}`} item={item} />
                        ))}
                    </div>
                </section>
            )}

            {/* Followed Signal */}
            {followedSignalItems.length > 0 && (
                <section className="mb-8 border border-translucent-emerald bg-muted-moss p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-heart-green" />
                        <h2 className="font-serif text-xl font-semibold text-bone-white">Followed Signal</h2>
                    </div>
                    <p className="mb-4 text-xs text-bone-white/70 font-mono">
                        New products and research in your followed Master Topics
                    </p>
                    <div className="space-y-3">
                        {followedSignalItems.slice(0, 10).map((item) => (
                            <FeedItemCard key={`${item.type}-${item.id}`} item={item} />
                        ))}
                    </div>
                </section>
            )}

            {/* Trust Trends */}
            {trustTrendItem && (
                <section className="mb-8 border border-sme-gold/30 bg-muted-moss p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-sme-gold" />
                        <h2 className="font-serif text-xl font-semibold text-bone-white">Trust Trends</h2>
                        <span className="border border-sme-gold/30 bg-sme-gold/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-sme-gold">
                            High Signal
                        </span>
                    </div>
                    <p className="mb-4 text-xs text-bone-white/70 font-mono">
                        Discovery from an unfollowed topic
                    </p>
                    <div className="border border-translucent-emerald bg-forest-obsidian p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <TopicBadge topic={trustTrendItem.topic} clickable={true} />
                            <span className="text-[10px] text-bone-white/50 font-mono">
                                {formatDistanceToNow(new Date(trustTrendItem.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <Link
                            href={`/discussions/${trustTrendItem.id}`}
                            className="block transition-colors hover:text-heart-green"
                        >
                            <h3 className="mb-2 font-serif text-lg font-semibold text-bone-white">
                                {trustTrendItem.title}
                            </h3>
                            <p className="mb-3 text-sm text-bone-white/80 font-mono leading-relaxed line-clamp-2">
                                {trustTrendItem.content}
                            </p>
                            {trustTrendItem.author_name && (
                                <div className="flex items-center gap-2 text-xs text-bone-white/70 font-mono">
                                    <Award size={12} className="text-sme-gold" />
                                    <span>Trusted Voice: </span>
                                    {trustTrendItem.author_username ? (
                                        <Link
                                            href={`/u/${trustTrendItem.author_username}`}
                                            className="hover:text-bone-white transition-colors"
                                        >
                                            {trustTrendItem.author_name}
                                        </Link>
                                    ) : (
                                        <span>{trustTrendItem.author_name}</span>
                                    )}
                                </div>
                            )}
                        </Link>
                    </div>
                </section>
            )}

            {/* Empty States */}
            {activeThreads.length === 0 && trackedSMEItems.length === 0 && followedSignalItems.length === 0 && !trustTrendItem && (
                <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
                    <p className="mb-4 text-sm text-bone-white/70 font-mono">
                        Your feed is empty. Start following topics to see personalized content!
                    </p>
                    <Link
                        href="/discussions"
                        className="inline-block text-xs font-medium text-heart-green hover:underline font-mono uppercase tracking-wider"
                    >
                        Explore Discussions →
                    </Link>
                </div>
            )}

            {/* Tagline - Anchored below feed content */}
            <div className="mt-12 mb-8 text-center border-t border-translucent-emerald pt-8">
                <p className="text-lg text-bone-white/80 font-mono">
                    Community-driven products for the gut, heart, and mind.
                </p>
            </div>
        </>
    );
}
