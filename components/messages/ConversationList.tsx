"use client";

import Image from "next/image";
import Link from "next/link";
import { Conversation } from "@/app/actions/messages";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function ConversationList({ conversations }: { conversations: Conversation[] }) {
    const searchParams = useSearchParams();
    const activeUserId = searchParams.get("userId");

    return (
        <div className="flex h-full flex-col bg-muted-moss/20 border-r border-translucent-emerald">
            <div className="p-4 border-b border-translucent-emerald">
                <h2 className="font-serif text-xl font-bold text-bone-white">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-bone-white/40 text-sm">
                        No messages yet.
                    </div>
                ) : (
                    conversations.map((c) => {
                        const isActive = activeUserId === c.other_user.id;
                        return (
                            <Link
                                key={c.other_user.id}
                                href={`/messages?userId=${c.other_user.id}`}
                                className={cn(
                                    "flex items-center gap-3 p-4 transition-colors hover:bg-muted-moss/50",
                                    isActive && "bg-muted-moss border-l-2 border-heart-green"
                                )}
                            >
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-translucent-emerald">
                                    <Image
                                        src={c.other_user.avatar_url || "/placeholder-avatar.png"}
                                        alt={c.other_user.username || "User"}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={cn("truncate font-medium text-sm", isActive ? "text-bone-white" : "text-bone-white/90")}>
                                            {c.other_user.full_name || c.other_user.username}
                                        </span>
                                        {c.last_message.created_at && (
                                            <span className="text-[10px] text-bone-white/40 shrink-0">
                                                {formatDistanceToNow(c.last_message.created_at, { addSuffix: false }).replace('about ', '')}
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn(
                                        "truncate text-xs",
                                        !c.last_message.is_read && c.last_message.sender_id === c.other_user.id ? "font-bold text-heart-green" : "text-bone-white/50"
                                    )}>
                                        {c.last_message.sender_id === c.other_user.id ? "" : "You: "}
                                        {c.last_message.content}
                                    </p>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
