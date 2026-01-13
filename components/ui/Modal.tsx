"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // For additional styling on the content container
}

export default function Modal({ isOpen, onClose, title, children, className = "" }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Handle escape key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = "hidden"; // Prevent background scrolling
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-obsidian/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={contentRef}
                className={`relative w-full max-w-lg bg-muted-moss border border-translucent-emerald shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200 ${className}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-translucent-emerald bg-forest-obsidian/50">
                    <h2 className="text-xl font-serif font-bold text-bone-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-bone-white/50 hover:text-bone-white hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
