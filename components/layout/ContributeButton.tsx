"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Microscope, MessageSquare, ChevronRight } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function ContributeButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-sme-gold/10 border border-sme-gold text-sme-gold hover:bg-sme-gold hover:text-forest-obsidian transition-all duration-300 font-mono text-xs uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] active:scale-95"
            >
                <Plus size={14} strokeWidth={3} />
                <span>Contribute</span>
            </button>

            {/* Mobile Icon Only */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden flex items-center justify-center w-10 h-10 text-sme-gold border border-sme-gold bg-sme-gold/10 hover:bg-sme-gold hover:text-forest-obsidian transition-colors active:scale-95"
            >
                <Plus size={20} />
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Contribute to the Protocol"
                className="max-w-2xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Share Evidence Option */}
                    <Link
                        href="/products/submit"
                        onClick={() => setIsOpen(false)}
                        className="group flex flex-col h-full border border-translucent-emerald bg-forest-obsidian/50 p-6 hover:bg-forest-obsidian hover:border-sme-gold transition-all duration-300 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="text-sme-gold transform group-hover:translate-x-1 transition-transform" />
                        </div>

                        <div className="w-12 h-12 rounded-full bg-sme-gold/10 flex items-center justify-center mb-4 group-hover:bg-sme-gold group-hover:text-forest-obsidian transition-colors text-sme-gold border border-sme-gold/30">
                            <Microscope size={24} />
                        </div>

                        <h3 className="text-lg font-serif font-bold text-bone-white mb-2 group-hover:text-sme-gold transition-colors">
                            Share Evidence
                        </h3>
                        <p className="text-sm text-bone-white/70 font-mono leading-relaxed">
                            Submit a product, supplement, or protocol for community review and scientific verification.
                        </p>
                    </Link>

                    {/* Start Discussion Option */}
                    <Link
                        href="/discussions/new"
                        onClick={() => setIsOpen(false)}
                        className="group flex flex-col h-full border border-translucent-emerald bg-forest-obsidian/50 p-6 hover:bg-forest-obsidian hover:border-heart-green transition-all duration-300 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="text-heart-green transform group-hover:translate-x-1 transition-transform" />
                        </div>

                        <div className="w-12 h-12 rounded-full bg-heart-green/10 flex items-center justify-center mb-4 group-hover:bg-heart-green group-hover:text-forest-obsidian transition-colors text-heart-green border border-heart-green/30">
                            <MessageSquare size={24} />
                        </div>

                        <h3 className="text-lg font-serif font-bold text-bone-white mb-2 group-hover:text-heart-green transition-colors">
                            Start Discussion
                        </h3>
                        <p className="text-sm text-bone-white/70 font-mono leading-relaxed">
                            Initiate a debate or conversation about health topics, ingredients, or holisitic approaches.
                        </p>
                    </Link>
                </div>

                <div className="mt-6 pt-4 border-t border-translucent-emerald/30 text-center">
                    <p className="text-xs text-bone-white/40 font-mono italic">
                        "The truth is not found, it is built."
                    </p>
                </div>
            </Modal>
        </>
    );
}
