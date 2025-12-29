'use client';

import { useState } from 'react';
import { createBrandCustomerPortalSession } from '@/app/actions/create-customer-portal-session';
import { AlertCircle, CreditCard } from 'lucide-react';

interface SubscriptionStatusBannerProps {
    subscriptionStatus: string;
}

export default function SubscriptionStatusBanner({ subscriptionStatus }: SubscriptionStatusBannerProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Only show banner for problematic statuses
    if (subscriptionStatus !== 'past_due' && subscriptionStatus !== 'canceled') {
        return null;
    }

    const handleManageBilling = async () => {
        setIsLoading(true);
        try {
            const result = await createBrandCustomerPortalSession();
            if (result.success && result.url) {
                window.location.href = result.url;
            } else {
                alert(result.error || 'Failed to open billing portal');
                setIsLoading(false);
            }
        } catch (err) {
            alert('Failed to open billing portal');
            setIsLoading(false);
        }
    };

    return (
        <div className="mb-8 border border-red-500/50 bg-red-900/20 p-6 rounded-lg">
            <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-400 mb-2 uppercase tracking-wider">
                        Payment Required
                    </h3>
                    <p className="text-white mb-4">
                        {subscriptionStatus === 'past_due'
                            ? 'Your subscription payment is past due. Your products are currently hidden from the marketplace and editing is disabled.'
                            : 'Your subscription has been canceled. Your products are currently hidden from the marketplace and editing is disabled.'
                        }
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleManageBilling}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded 
                                     hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-colors uppercase tracking-wider text-sm"
                        >
                            <CreditCard className="w-4 h-4" />
                            {isLoading ? 'Loading...' : 'Manage Billing'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
