"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ChatUser = {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
};

interface ChatContextType {
    activeChatUser: ChatUser | null;
    openChat: (user: ChatUser) => void;
    closeChat: () => void;
    isMinimized: boolean;
    toggleMinimize: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const openChat = (user: ChatUser) => {
        setActiveChatUser(user);
        setIsMinimized(false);
    };

    const closeChat = () => {
        setActiveChatUser(null);
        setIsMinimized(false);
    };

    const toggleMinimize = () => {
        setIsMinimized((prev) => !prev);
    };

    return (
        <ChatContext.Provider value={{ activeChatUser, openChat, closeChat, isMinimized, toggleMinimize }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
