'use client';

import { useState } from 'react';
import { Package, Users } from 'lucide-react';
import ApprovalQueueTable from './ApprovalQueueTable';
import SMECandidateCard from './SMECandidateCard';

interface AdminDashboardTabsProps {
    productQueue: any[];
    smeQueue: any[];
}

export default function AdminDashboardTabs({ productQueue, smeQueue }: AdminDashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<'products' | 'sme'>('products');

    return (
        <div>
            {/* Tab Navigation */}
            <div className="mb-6 flex gap-2 border-b border-bone-white/20">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wider transition-colors ${activeTab === 'products'
                            ? 'border-emerald-500 text-emerald-400'
                            : 'border-transparent text-bone-white/50 hover:text-bone-white/70'
                        }`}
                >
                    <Package className="h-4 w-4" />
                    Product Queue
                    <span className="rounded-full bg-bone-white/10 px-2 py-0.5 text-xs">
                        {productQueue.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('sme')}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wider transition-colors ${activeTab === 'sme'
                            ? 'border-emerald-500 text-emerald-400'
                            : 'border-transparent text-bone-white/50 hover:text-bone-white/70'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    SME Candidates
                    <span className="rounded-full bg-bone-white/10 px-2 py-0.5 text-xs">
                        {smeQueue.length}
                    </span>
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'products' ? (
                <div className="rounded-lg border border-bone-white/20 bg-bone-white/5 p-6">
                    <h2 className="mb-4 font-mono text-xl font-bold text-bone-white">
                        Product Approval Queue
                    </h2>
                    <ApprovalQueueTable initialQueue={productQueue} />
                </div>
            ) : (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-mono text-xl font-bold text-bone-white">
                            SME Candidate Review
                        </h2>
                        <span className="font-mono text-sm text-bone-white/60">
                            Sorted by reputation (highest first)
                        </span>
                    </div>

                    {smeQueue.length === 0 ? (
                        <div className="rounded-lg border border-bone-white/20 bg-bone-white/5 p-12 text-center">
                            <Users className="mx-auto mb-4 h-12 w-12 text-bone-white/30" />
                            <p className="font-mono text-sm text-bone-white/50">
                                No SME applications pending review
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {smeQueue.map((candidate: any) => (
                                <SMECandidateCard key={candidate.application_id} candidate={candidate} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
