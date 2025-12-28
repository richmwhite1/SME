'use client';

import { X, BarChart3, Eye, MousePointer } from 'lucide-react';

interface ProductAnalyticsModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductAnalyticsModal({
    product,
    isOpen,
    onClose,
}: ProductAnalyticsModalProps) {
    if (!isOpen) return null;

    // Default to 0 if columns are null (since we just migrated)
    const views = product.view_count || 0;
    const clicks = product.click_count || 0;
    // Simple conversion rate
    const conversionRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-bone-white/20 bg-forest-obsidian">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-bone-white/20 bg-forest-obsidian/95 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-400">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h2 className="font-mono text-lg font-bold text-bone-white">
                                Analytics
                            </h2>
                            <p className="font-mono text-xs text-bone-white/60">
                                {product.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-bone-white/60 transition-colors hover:bg-bone-white/10 hover:text-bone-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Views Card */}
                        <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-4 text-center transition-transform hover:scale-105">
                            <div className="mb-2 flex items-center justify-center gap-2 text-bone-white/60">
                                <Eye size={16} />
                                <span className="font-mono text-xs uppercase tracking-wider">Page Views</span>
                            </div>
                            <span className="block font-mono text-3xl font-bold text-bone-white">
                                {views.toLocaleString()}
                            </span>
                        </div>

                        {/* Clicks Card */}
                        <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-4 text-center transition-transform hover:scale-105">
                            <div className="mb-2 flex items-center justify-center gap-2 text-bone-white/60">
                                <MousePointer size={16} />
                                <span className="font-mono text-xs uppercase tracking-wider">Buy Clicks</span>
                            </div>
                            <span className="block font-mono text-3xl font-bold text-emerald-400">
                                {clicks.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Conversion Stats */}
                    <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-bone-white/80">Conversion Rate</span>
                            <span className="font-mono text-xl font-bold text-emerald-400">{conversionRate}%</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bone-white/10">
                            <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
                            />
                        </div>
                        <p className="mt-2 text-center font-mono text-xs text-bone-white/40">
                            Percentage of viewers who clicked the buy link
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
