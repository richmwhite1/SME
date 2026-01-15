"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, UserPlus, UserCheck, Shield, Award, Users } from "lucide-react";
import { CommunityUser, followUser, unfollowUser } from "@/app/actions/community";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChat } from "../messages/ChatContext";
import { ChakraBadge } from "../sme/ChakraBadge";

interface UserCardProps {
    user: CommunityUser;
}

export default function UserCard({ user }: UserCardProps) {
    const [isPending, startTransition] = useTransition();
    const [isFollowing, setIsFollowing] = useState(user.is_following);
    const router = useRouter();
    const { openChat } = useChat();

    const handleFollowToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newStatus = !isFollowing;
        setIsFollowing(newStatus); // Optimistic update

        startTransition(async () => {
            try {
                if (newStatus) {
                    await followUser(user.id);
                } else {
                    await unfollowUser(user.id);
                }
                router.refresh(); // This will help with feed content removal
            } catch (error) {
                setIsFollowing(!newStatus); // Revert on error
                console.error("Follow action failed:", error);
            }
        });
    };

    const handleMessageClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openChat({
            id: user.id,
            username: user.username || "",
            full_name: user.full_name,
            avatar_url: user.avatar_url
        });
    };

    return (
        <Link href={`/u/${user.username}`}>
            <div className="group relative flex flex-col rounded-lg border border-translucent-emerald bg-muted-moss/50 p-6 transition-all hover:bg-muted-moss hover:shadow-lg hover:shadow-black/20">

                {/* Header: Avatar & Name */}
                <div className="mb-4 flex items-start gap-4">
                    <div className="relative h-14 w-14 shrink-0">
                        <div className="relative h-full w-full overflow-hidden rounded-full border border-sme-gold/30">
                            <Image
                                src={user.avatar_url || "/placeholder-avatar.png"}
                                alt={user.username || "User"}
                                fill
                                className="object-cover"
                            />
                        </div>
                        {user.is_online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-heart-green border-2 border-forest-obsidian" title="Online now" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate font-serif text-lg font-bold text-bone-white">
                                {user.full_name || user.username}
                            </h3>
                            {user.is_verified_expert && (
                                <Shield size={14} className="text-sme-gold shrink-0" fill="currentColor" />
                            )}
                        </div>
                        {user.profession && (
                            <p className="truncate text-xs font-mono text-bone-white/60">
                                {user.profession}
                            </p>
                        )}

                        {/* Chakra Level & Badge */}
                        <div className="mt-1 flex items-center gap-3 text-xs font-mono">
                            <ChakraBadge level={user.chakra_level} showTitle={false} size="sm" />
                            {user.badge_type && (
                                <div className="flex items-center gap-1 text-sme-gold">
                                    <Award size={10} />
                                    <span>{user.badge_type}</span>
                                </div>
                            )}
                            {user.is_mutual && (
                                <div className="flex items-center gap-1 text-sme-gold" title="You follow each other">
                                    <Users size={10} />
                                    <span>Mutual</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm text-bone-white/80">
                    {user.bio || "No bio provided."}
                </p>

                {/* Pillar Expertise Tags */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {user.pillar_expertise && user.pillar_expertise.length > 0 ? (
                        user.pillar_expertise.map((pillar) => (
                            <span
                                key={pillar}
                                className="rounded bg-sme-gold/10 px-2 py-0.5 text-xs text-sme-gold border border-sme-gold/30 font-mono"
                                title="SME Pillar Expertise"
                            >
                                {pillar}
                            </span>
                        ))
                    ) : (
                        /* Only show empty state if we really want to emphasize lack of expertise, otherwise keep clean */
                        null
                    )}
                </div>

                {/* Actions */}
                <div className="mt-auto flex items-center gap-3">
                    <button
                        onClick={handleFollowToggle}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-xs font-medium transition-colors font-mono uppercase tracking-wider",
                            isFollowing
                                ? "bg-transparent border border-translucent-emerald text-bone-white/60 hover:text-red-400 hover:border-red-400/50"
                                : "bg-heart-green hover:bg-heart-green/90 text-forest-obsidian"
                        )}
                    >
                        {isFollowing ? (
                            <>
                                <UserCheck size={14} />
                                Following
                            </>
                        ) : (
                            <>
                                <UserPlus size={14} />
                                Follow
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleMessageClick}
                        className="flex items-center justify-center rounded border border-translucent-emerald bg-forest-obsidian px-3 py-2 text-bone-white/70 hover:border-heart-green hover:text-bone-white transition-colors"
                    >
                        <MessageCircle size={16} />
                    </button>
                </div>

            </div>
        </Link>
    );
}
