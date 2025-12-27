"use client";

import { useState, useRef, useEffect } from "react";
import { Smile, X } from "lucide-react";

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    buttonClassName?: string;
    pickerClassName?: string;
}

const EMOJI_CATEGORIES = {
    "Smileys": ["😀", "😃", "😄", "😁", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓"],
    "Gestures": ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
    "Nature": ["🌱", "🌿", "☘️", "🍀", "🌾", "🌵", "🌴", "🌳", "🌲", "🪵", "🌰", "🍄", "🌻", "🌺", "🌸", "🌼", "🌷", "🌹", "🥀", "💐", "🌏", "🌍", "🌎", "🌙", "⭐", "✨", "⚡", "🔥", "💧", "🌊"],
    "Objects": ["💡", "🔬", "🧪", "🧬", "💊", "🩺", "🛡️", "⚠️", "📚", "📖", "📝", "✏️", "🖊️", "💎", "🔮", "🧿", "👁️", "🕯️", "🎯", "✅", "❌"],
};

export default function EmojiPicker({
    onEmojiSelect,
    buttonClassName = "",
    pickerClassName = "",
}: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Smileys");
    const pickerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block">
            {/* Emoji Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 text-bone-white/40 hover:text-yellow-400 transition-colors ${buttonClassName}`}
                title="Insert Emoji"
            >
                <Smile size={16} />
            </button>

            {/* Emoji Picker Popover */}
            {isOpen && (
                <div
                    ref={pickerRef}
                    className={`absolute bottom-full mb-2 left-0 z-[9999] w-[320px] bg-forest-obsidian border border-translucent-emerald shadow-2xl rounded-lg overflow-hidden ${pickerClassName}`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-translucent-emerald bg-muted-moss">
                        <span className="text-sm font-mono text-bone-white font-semibold">
                            Insert Emoji
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-bone-white/60 hover:text-bone-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-1 p-2 border-b border-translucent-emerald/50 bg-black/20 overflow-x-auto">
                        {Object.keys(EMOJI_CATEGORIES).map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
                                className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${selectedCategory === category
                                        ? "bg-heart-green text-forest-obsidian font-semibold"
                                        : "text-bone-white/60 hover:text-bone-white hover:bg-white/5"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Emoji Grid */}
                    <div className="p-3 max-h-[240px] overflow-y-auto bg-forest-obsidian">
                        <div className="grid grid-cols-8 gap-2">
                            {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
                                <button
                                    key={`${emoji}-${index}`}
                                    type="button"
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="text-2xl hover:bg-white/10 rounded p-1 transition-colors active:scale-95 transform"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Hint */}
                    <div className="p-2 bg-muted-moss border-t border-translucent-emerald">
                        <p className="text-[10px] text-bone-white/50 font-mono text-center">
                            Click an emoji to insert at cursor position
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
