'use client';

import { useState } from 'react';
import { updateProductBrandFields } from '@/app/actions/update-product-brand-fields';
import { X } from 'lucide-react';

interface ProductEditModalProps {
    productId: string;
    productTitle: string;
    currentBuyUrl?: string | null;
    currentDiscountCode?: string | null;
    isSubscriptionActive: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProductEditModal({
    productId,
    productTitle,
    currentBuyUrl,
    currentDiscountCode,
    isSubscriptionActive,
    onClose,
    onSuccess,
}: ProductEditModalProps) {
    const [buyUrl, setBuyUrl] = useState(currentBuyUrl || '');
    const [discountCode, setDiscountCode] = useState(currentDiscountCode || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Basic URL validation
            if (buyUrl && !buyUrl.startsWith('http://') && !buyUrl.startsWith('https://')) {
                setError('Buy URL must start with http:// or https://');
                setIsLoading(false);
                return;
            }

            const result = await updateProductBrandFields({
                productId,
                buyUrl: buyUrl || undefined,
                discountCode: discountCode || undefined,
            });

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Failed to update product');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] border border-[#333] rounded-lg max-w-2xl w-full p-8 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider">
                    Edit Product Details
                </h2>
                <p className="text-sm text-gray-500 mb-6">{productTitle}</p>

                {/* Subscription warning */}
                {!isSubscriptionActive && (
                    <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded">
                        <p className="text-yellow-400 text-sm font-semibold">
                            ⚠️ Editing disabled - Subscription payment required
                        </p>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Buy URL */}
                    <div>
                        <label htmlFor="buyUrl" className="block text-sm font-semibold text-white mb-2 uppercase tracking-wider">
                            External Purchase URL
                        </label>
                        <input
                            type="url"
                            id="buyUrl"
                            value={buyUrl}
                            onChange={(e) => setBuyUrl(e.target.value)}
                            disabled={!isSubscriptionActive || isLoading}
                            placeholder="https://example.com/product"
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] text-white rounded 
                                     focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed
                                     font-mono text-sm"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                            Where the &quot;Buy Now&quot; button will redirect users
                        </p>
                    </div>

                    {/* Discount Code */}
                    <div>
                        <label htmlFor="discountCode" className="block text-sm font-semibold text-white mb-2 uppercase tracking-wider">
                            Discount Code
                        </label>
                        <input
                            type="text"
                            id="discountCode"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            disabled={!isSubscriptionActive || isLoading}
                            placeholder="SAVE20"
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] text-white rounded 
                                     focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed
                                     font-mono text-sm uppercase"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                            Optional promo code to display with the Buy Now button
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={!isSubscriptionActive || isLoading}
                            className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded 
                                     hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-colors uppercase tracking-wider text-sm"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-[#1a1a1a] border border-[#333] text-white font-semibold rounded 
                                     hover:bg-[#222] transition-colors uppercase tracking-wider text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
