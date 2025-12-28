"use client";

import { useOptimistic, useRef, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Message, sendMessage } from "@/app/actions/messages";
import { format } from "date-fns";
import { Send, User } from "lucide-react";
import Link from "next/link";

interface ChatWindowProps {
    otherUser: {
        id: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
    };
    currentUser: {
        id: string;
        avatar_url: string | null;
    };
    initialMessages: Message[];
}

export default function ChatWindow({ otherUser, currentUser, initialMessages }: ChatWindowProps) {
    const [messages, addOptimisticMessage] = useOptimistic(
        initialMessages,
        (state, newMessage: Message) => [...state, newMessage]
    );

    const [error, setError] = useState<string | null>(null);
    const [honeypot, setHoneypot] = useState("");
    const [isReportOpen, setIsReportOpen] = useState(false);

    // Restore input state
    const [input, setInput] = useState("");
    const [pending, startTransition] = useTransition();

    // Restore bottomRef
    const bottomRef = useRef<HTMLDivElement>(null);

    // Filter out honeypot from initial messages if needed, or rely on server to not send it?
    // The server doesn't send it.

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Import dynamically or at top if possible. For this edit, I'll assume imports are handled or I'd need to add them.
    // I will use a simple confirm for now for reporting, or a small UI toggle.

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || pending) return;
        setError(null);

        const content = input;
        setInput("");

        // Optimistic update
        const tempMessage: Message = {
            id: crypto.randomUUID(),
            sender_id: currentUser.id,
            recipient_id: otherUser.id,
            content: content,
            is_read: false,
            created_at: new Date(),
        };

        startTransition(async () => {
            addOptimisticMessage(tempMessage);
            try {
                // Pass honeypot value
                await sendMessage(otherUser.id, content, honeypot);
            } catch (error: any) {
                console.error("Failed to send message", error);
                setError(error.message || "Failed to send message");
                // Ideally rollback optimistic update here, but for now just show error
            }
        });
    }

    async function handleReport() {
        if (!confirm("Are you sure you want to report this user for spam? Doing so may block them from sending messages.")) return;
        try {
            const { reportSpam } = await import("@/app/actions/report-spam");
            await reportSpam(otherUser.id, "spam");
            alert("User reported successfully.");
        } catch (e) {
            alert("Failed to report user.");
        }
    }

    return (
        <div className="flex h-full flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-translucent-emerald bg-muted-moss/10 p-4">
                <div className="flex items-center gap-3">
                    <Link href={`/u/${otherUser.username}`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-translucent-emerald hover:border-sme-gold transition-colors">
                        <Image
                            src={otherUser.avatar_url || "/placeholder-avatar.png"}
                            alt={otherUser.username || "User"}
                            fill
                            className="object-cover"
                        />
                    </Link>
                    <div>
                        <Link href={`/u/${otherUser.username}`} className="font-bold text-bone-white hover:underline decoration-heart-green">
                            {otherUser.full_name || otherUser.username}
                        </Link>
                        <div className="text-xs text-bone-white/50">@{otherUser.username}</div>
                    </div>
                </div>
                <button
                    onClick={handleReport}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline px-2"
                    title="Report Spam"
                >
                    Report Spam
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-forest-obsidian/30">
                {messages.length === 0 ? (
                    <div className="mt-10 text-center text-sm text-bone-white/40">
                        Start a conversation with {otherUser.full_name || otherUser.username}.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 text-sm ${isMe
                                        ? "bg-heart-green text-forest-obsidian rounded-tr-none"
                                        : "bg-muted-moss text-bone-white border border-translucent-emerald rounded-tl-none"
                                        }`}
                                >
                                    <p>{msg.content}</p>
                                    <div className={`mt-1 text-[10px] ${isMe ? "text-forest-obsidian/60" : "text-bone-white/40"} text-right`}>
                                        {format(new Date(msg.created_at), "h:mm a")}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/50 border-t border-red-500/50 p-2 text-center text-xs text-red-200">
                    {error}
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-translucent-emerald bg-muted-moss/10">
                <form onSubmit={handleSend} className="flex gap-2 relative">
                    {/* HONEYPOT FIELD - Hidden from real users */}
                    <input
                        type="text"
                        name="website_url_hp"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        className="absolute opacity-0 -z-10 h-0 w-0"
                        tabIndex={-1}
                        autoComplete="off"
                    />

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full bg-forest-obsidian border border-translucent-emerald px-4 py-2 text-sm text-bone-white placeholder:text-bone-white/30 focus:border-heart-green focus:outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || pending}
                        className="rounded-full bg-heart-green p-2 text-forest-obsidian transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
