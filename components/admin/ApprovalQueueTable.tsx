'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface ApprovalQueueTableProps {
    initialQueue: any[];
}

type SortField = 'product_name' | 'brand' | 'total_signals' | 'red_flags' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ApprovalQueueTable({ initialQueue }: ApprovalQueueTableProps) {
    const router = useRouter();
    const [queue, setQueue] = useState(initialQueue);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');

    // Filter and sort queue
    const filteredAndSortedQueue = useMemo(() => {
        let filtered = queue;

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((item) => item.admin_status === statusFilter);
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            // Handle null/undefined values
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            // Convert to comparable values
            if (sortField === 'created_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [queue, sortField, sortDirection, statusFilter]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleRowClick = (product: any) => {
        router.push(`/admin/approval/${product.id}`);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
        ) : (
            <ChevronDown className="h-4 w-4" />
        );
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
                <label className="font-mono text-sm text-bone-white/70">Filter by Status:</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="rounded border border-bone-white/20 bg-bone-white/5 px-3 py-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                    <option value="all">All</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
                <span className="ml-auto font-mono text-sm text-bone-white/60">
                    {filteredAndSortedQueue.length} product{filteredAndSortedQueue.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-bone-white/20">
                <table className="w-full font-mono text-sm">
                    <thead className="border-b border-bone-white/20 bg-bone-white/5">
                        <tr>
                            <th
                                onClick={() => handleSort('product_name')}
                                className="cursor-pointer px-4 py-3 text-left font-semibold uppercase tracking-wider text-bone-white/70 transition-colors hover:bg-bone-white/10"
                            >
                                <div className="flex items-center gap-2">
                                    Product Name
                                    <SortIcon field="product_name" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('brand')}
                                className="cursor-pointer px-4 py-3 text-left font-semibold uppercase tracking-wider text-bone-white/70 transition-colors hover:bg-bone-white/10"
                            >
                                <div className="flex items-center gap-2">
                                    Brand
                                    <SortIcon field="brand" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('total_signals')}
                                className="cursor-pointer px-4 py-3 text-center font-semibold uppercase tracking-wider text-bone-white/70 transition-colors hover:bg-bone-white/10"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    Total Signals
                                    <SortIcon field="total_signals" />
                                </div>
                            </th>
                            <th
                                onClick={() => handleSort('red_flags')}
                                className="cursor-pointer px-4 py-3 text-center font-semibold uppercase tracking-wider text-bone-white/70 transition-colors hover:bg-bone-white/10"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    Red Flags
                                    <SortIcon field="red_flags" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center font-semibold uppercase tracking-wider text-bone-white/70">
                                Status
                            </th>
                            <th
                                onClick={() => handleSort('created_at')}
                                className="cursor-pointer px-4 py-3 text-left font-semibold uppercase tracking-wider text-bone-white/70 transition-colors hover:bg-bone-white/10"
                            >
                                <div className="flex items-center gap-2">
                                    Submitted
                                    <SortIcon field="created_at" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bone-white/10">
                        {filteredAndSortedQueue.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-bone-white/40">
                                    No products in queue
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedQueue.map((product) => (
                                <tr
                                    key={product.id}
                                    onClick={() => handleRowClick(product)}
                                    className="cursor-pointer transition-colors hover:bg-bone-white/5"
                                >
                                    <td className="px-4 py-3 text-bone-white">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-bone-white/50" />
                                            {product.product_name || 'Unnamed Product'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-bone-white/70">
                                        {product.brand || 'No brand'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-400">
                                            <CheckCircle className="h-3 w-3" />
                                            {product.total_signals || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-400">
                                            <AlertTriangle className="h-3 w-3" />
                                            {product.red_flags || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={product.admin_status} />
                                    </td>
                                    <td className="px-4 py-3 text-bone-white/60">
                                        {new Date(product.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = {
        pending_review: {
            icon: Clock,
            text: 'Pending',
            className: 'bg-yellow-500/20 text-yellow-400',
        },
        approved: {
            icon: CheckCircle,
            text: 'Approved',
            className: 'bg-emerald-500/20 text-emerald-400',
        },
        rejected: {
            icon: AlertTriangle,
            text: 'Rejected',
            className: 'bg-red-500/20 text-red-400',
        },
    };

    const { icon: Icon, text, className } = config[status as keyof typeof config] || config.pending_review;

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
            <Icon className="h-3 w-3" />
            {text}
        </span>
    );
}
