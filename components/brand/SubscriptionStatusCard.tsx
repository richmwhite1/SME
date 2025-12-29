"use client";

import { useState } from "react";
import { createPortalSession } from "@/app/actions/create-portal-session";
import { CreditCard, ExternalLink } from "lucide-react";

interface SubscriptionStatusProps {
    status: string;
    totalViews: number;
}

export default function SubscriptionStatusCard({ status, totalViews }: SubscriptionStatusProps) {
    const [loading, setLoading] = useState(false);

    const handleManageBilling = async () => {
        setLoading(true);
        try {
            const result = await createPortalSession();
            if (result.success && result.url) {
                window.location.href = result.url;
            } else {
                alert("Failed to open billing portal: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error opening billing portal:", error);
            alert("Failed to open billing portal");
        } finally {
            setLoading(false);
        }
    };

    // Calculate estimated charge ($0.01 per view, minimum $100)
    const estimatedCharge = Math.max(100, totalViews * 0.01);

    // Get status color
    const getStatusColor = () => {
        switch (status) {
            case "active":
                return "text-emerald-400 bg-emerald-900/30 border-emerald-500/50";
            case "past_due":
                return "text-yellow-400 bg-yellow-900/30 border-yellow-500/50";
            case "canceled":
                return "text-red-400 bg-red-900/30 border-red-500/50";
            default:
                return "text-gray-400 bg-gray-900/30 border-gray-500/50";
        }
    };

    return (
        <div className="border border-[#333] bg-[#111] p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">Subscription Status</p>
                    </div>
                    <p className={`inline-block px-3 py-1 text-sm font-semibold uppercase rounded border ${getStatusColor()}`}>
                        {status}
                    </p>
                </div>

                <button
                    onClick={handleManageBilling}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white text-sm font-semibold rounded hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        "Loading..."
                    ) : (
                        <>
                            Manage Billing
                            <ExternalLink className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>

            {/* Usage Metrics */}
            <div className="pt-4 border-t border-[#333] space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">This Month&apos;s Views:</span>
                    <span className="text-white font-semibold">{totalViews.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Charge:</span>
                    <span className="text-white font-semibold">${estimatedCharge.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                    Billing: $100 base + $0.01 per view (whichever is greater)
                </p>
            </div>
        </div>
    );
}
