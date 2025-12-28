"use client";

import { useChat } from "./ChatContext";
import ChatWindow from "./ChatWindow";
import { useEffect, useState } from "react";
import { getMessages, Message } from "@/app/actions/messages";
import { X, Minus, Maximize2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function GlobalChatDrawer() {
    const { activeChatUser, closeChat, isMinimized, toggleMinimize } = useChat();
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeChatUser && !isMinimized) {
            setLoading(true);
            getMessages(activeChatUser.id).then((msgs) => {
                setMessages(msgs);
                setLoading(false);
            });
            // Poll for new messages every 5s while open
            const interval = setInterval(() => {
                getMessages(activeChatUser.id).then(setMessages);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [activeChatUser, isMinimized]);

    if (!activeChatUser || !user) return null;

    const currentUser = {
        id: user.id,
        avatar_url: user.imageUrl,
    };

    if (isMinimized) {
        return (
            <div
                onClick={toggleMinimize}
                className="fixed bottom-0 right-4 w-72 h-12 bg-forest-obsidian border border-translucent-emerald rounded-t-lg flex items-center justify-between px-4 cursor-pointer shadow-lg hover:bg-muted-moss/50 transition-colors z-50"
            >
                <span className="font-bold text-bone-white text-sm truncate">
                    {activeChatUser.full_name || activeChatUser.username}
                </span>
                <button onClick={(e) => { e.stopPropagation(); closeChat(); }} className="text-bone-white/60 hover:text-bone-white">
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 right-4 w-80 md:w-96 h-[500px] max-h-[80vh] bg-forest-obsidian border border-translucent-emerald rounded-t-lg shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-muted-moss/20 border-b border-translucent-emerald">
                <div className="font-bold text-bone-white text-sm truncate">
                    {activeChatUser.full_name || activeChatUser.username}
                </div>
                <div className="flex items-center gap-2 text-bone-white/60">
                    <button onClick={toggleMinimize} className="hover:text-bone-white">
                        <Minus size={16} />
                    </button>
                    <button onClick={closeChat} className="hover:text-bone-white">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden">
                {loading && messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-bone-white/40 text-sm">Loading...</div>
                ) : (
                    <ChatWindow
                        currentUser={currentUser}
                        otherUser={activeChatUser}
                        initialMessages={messages}
                    />
                )}
            </div>
        </div>
    );
}
