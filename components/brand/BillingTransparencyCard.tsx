'use client';

import { useEffect, useState } from 'react';
import { getStripeUsage } from '@/app/actions/get-stripe-usage';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function BillingTransparencyCard() {
    const [usageData, setUsageData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchUsage() {
            try {
                const result = await getStripeUsage();
                if (result.success) {
                    setUsageData(result);
                } else {
                    setError(result.error || 'Failed to load usage data');
                }
            } catch (err) {
                setError('Failed to load usage data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchUsage();
    }, []);

    if (isLoading) {
        return (
            <div className="border border-[#333] bg-[#111] p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                        Billing Transparency
                    </h2>
                </div>
                <p className="text-gray-500 text-sm">Loading usage data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-[#333] bg-[#111] p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                        Billing Transparency
                    </h2>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    const { hasMeteredBilling, totalUsage, dailyAverage, projectedCost, currentPeriodStart, currentPeriodEnd, daysInPeriod, daysElapsed } = usageData;

    // Calculate projected billing
    const baseSubscription = 100; // $100/month base
    const perVisitRate = 0.01; // $0.01 per visit
    const usageCost = hasMeteredBilling && totalUsage ? totalUsage * perVisitRate : 0;
    const finalProjectedCost = projectedCost || Math.max(baseSubscription, usageCost);

    // Calculate billing period progress
    const progressPercentage = daysInPeriod > 0 ? Math.min(100, (daysElapsed / daysInPeriod) * 100) : 0;

    return (
        <div className="border border-[#333] bg-[#111] p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Billing Transparency
                </h2>
            </div>

            {/* Pricing Logic */}
            <div className="mb-6 p-4 bg-emerald-900/10 border border-emerald-500/30 rounded">
                <p className="text-emerald-400 font-semibold text-sm mb-2">PRICING MODEL</p>
                <p className="text-white text-base">
                    $100/month base <span className="text-gray-500">or</span> $0.01 per visit
                </p>
                <p className="text-gray-500 text-xs mt-1">
                    Whichever is greater
                </p>
            </div>

            {/* Current Period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[#0a0a0a] border border-[#333] rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">Billing Period</p>
                    </div>
                    <p className="text-white text-sm font-mono">
                        {currentPeriodStart && new Date(currentPeriodStart).toLocaleDateString()} -{' '}
                        {currentPeriodEnd && new Date(currentPeriodEnd).toLocaleDateString()}
                    </p>
                    {daysInPeriod && daysElapsed && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Day {daysElapsed} of {daysInPeriod}</span>
                                <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <div className="w-full bg-[#222] rounded-full h-1.5">
                                <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-[#0a0a0a] border border-[#333] rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">Total Visits</p>
                    </div>
                    <p className="text-white text-2xl font-bold">
                        {hasMeteredBilling ? (totalUsage || 0).toLocaleString() : 'N/A'}
                    </p>
                    {hasMeteredBilling && dailyAverage !== undefined && (
                        <p className="text-gray-500 text-xs mt-1">
                            ~{dailyAverage} visits/day avg
                        </p>
                    )}
                </div>

                <div className="p-4 bg-[#0a0a0a] border border-[#333] rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">Usage Cost</p>
                    </div>
                    <p className="text-white text-2xl font-bold">
                        ${usageCost.toFixed(2)}
                    </p>
                    {hasMeteredBilling && totalUsage && (
                        <p className="text-gray-500 text-xs mt-1">
                            {totalUsage} × $0.01
                        </p>
                    )}
                </div>
            </div>

            {/* Projected Billing */}
            <div className="p-4 bg-[#0a0a0a] border border-emerald-500/50 rounded">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">
                    Projected Billing This Period
                </p>
                <p className="text-emerald-400 text-3xl font-bold">
                    ${finalProjectedCost.toFixed(2)}
                </p>
                {hasMeteredBilling && usageCost > baseSubscription && (
                    <p className="text-gray-500 text-xs mt-2">
                        ✅ Usage-based billing active ({totalUsage} visits × $0.01 = ${usageCost.toFixed(2)})
                    </p>
                )}
                {(!hasMeteredBilling || usageCost <= baseSubscription) && (
                    <p className="text-gray-500 text-xs mt-2">
                        Base subscription rate ($100/month minimum)
                    </p>
                )}
            </div>

            {/* Metered Billing Status */}
            {!hasMeteredBilling && (
                <div className="mt-4 p-3 bg-blue-900/10 border border-blue-500/30 rounded">
                    <p className="text-blue-400 text-xs">
                        ℹ️ Metered billing not yet configured. Contact support to enable usage-based pricing.
                    </p>
                </div>
            )}
        </div>
    );
}
