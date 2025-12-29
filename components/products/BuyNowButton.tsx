"use client";

import { useState } from "react";
import { ShoppingCart, Tag, ExternalLink } from "lucide-react";

interface BuyNowButtonProps {
    productId: string;
    productTitle: string;
    discountCode?: string | null;
    buyUrl?: string | null;
}

export default function BuyNowButton({ productId, productTitle, discountCode, buyUrl }: BuyNowButtonProps) {
    const [showDiscountCode, setShowDiscountCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        if (discountCode) {
            navigator.clipboard.writeText(discountCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // If no buy URL is provided, don't show the button
    if (!buyUrl) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Buy It Now Button */}
            <a
                href={buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
          flex items-center justify-center gap-3
          w-full px-8 py-4
          bg-gradient-to-r from-emerald-600 to-emerald-700
          hover:from-emerald-500 hover:to-emerald-600
          text-white font-bold text-lg uppercase tracking-wider
          rounded-lg
          shadow-lg shadow-emerald-900/50
          hover:shadow-emerald-900/70
          transition-all duration-300
          hover:scale-105
          border-2 border-emerald-500/50
        "
            >
                <ShoppingCart className="w-6 h-6" />
                Buy It Now
                <ExternalLink className="w-4 h-4" />
            </a>

            {/* Discount Code Section */}
            {discountCode && (
                <div className="border border-[#333] bg-[#111] rounded-lg p-4">
                    <button
                        onClick={() => setShowDiscountCode(!showDiscountCode)}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-white">
                                Exclusive Discount Code Available
                            </span>
                        </div>
                        <span className="text-xs text-gray-500">
                            {showDiscountCode ? "Hide" : "Show"}
                        </span>
                    </button>

                    {showDiscountCode && (
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-emerald-500/50 rounded font-mono text-emerald-400 text-lg font-bold text-center">
                                    {discountCode}
                                </div>
                                <button
                                    onClick={handleCopyCode}
                                    className="px-4 py-3 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 text-sm font-semibold rounded hover:bg-emerald-600/30 transition-colors"
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Use this code at checkout for an exclusive discount
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
                <span>Verified Brand • Secure Checkout</span>
            </div>
        </div>
    );
}
