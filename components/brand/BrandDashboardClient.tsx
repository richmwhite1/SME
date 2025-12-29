'use client';

import { useState } from 'react';
import { Package, Edit } from 'lucide-react';
import SMECertificationModal from '@/components/brand/SMECertificationModal';
import ProductEditModal from '@/components/brand/ProductEditModal';

interface Product {
    id: string;
    title: string;
    slug: string;
    is_verified: boolean;
    is_sme_certified: boolean;
    discount_code: string | null;
    buy_url: string | null;
    visit_count: number;
    created_at: string;
}

interface BrandDashboardClientProps {
    products: Product[];
    isSubscriptionActive: boolean;
}

export default function BrandDashboardClient({ products, isSubscriptionActive }: BrandDashboardClientProps) {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleEditSuccess = () => {
        setRefreshKey(prev => prev + 1);
        // Force a page refresh to show updated data
        window.location.reload();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white uppercase">Your Products</h2>
            </div>

            {products.length === 0 ? (
                <div className="border border-[#333] bg-[#111] p-12 text-center">
                    <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">No products yet</p>
                    <a
                        href="/products/new"
                        className="inline-block mt-4 px-6 py-2 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 text-sm font-semibold rounded hover:bg-emerald-600/30"
                    >
                        List Your First Product
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="border border-[#333] bg-[#111] p-6 rounded-lg"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-white">
                                            {product.title}
                                        </h3>
                                        {product.is_sme_certified && (
                                            <span className="px-3 py-1 bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 text-xs font-semibold rounded">
                                                SME CERTIFIED
                                            </span>
                                        )}
                                        {product.is_verified && !product.is_sme_certified && (
                                            <span className="px-3 py-1 bg-blue-900/30 border border-blue-500/50 text-blue-400 text-xs font-semibold rounded">
                                                VERIFIED
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Views</p>
                                            <p className="text-white font-semibold">{product.visit_count || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Buy URL</p>
                                            <p className="text-white font-semibold text-xs truncate">
                                                {product.buy_url ? new URL(product.buy_url).hostname : "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Discount Code</p>
                                            <p className="text-white font-semibold">
                                                {product.discount_code || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Listed</p>
                                            <p className="text-white font-semibold">
                                                {new Date(product.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                    <a
                                        href={`/products/${product.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-white text-sm font-semibold rounded hover:bg-[#222] text-center"
                                    >
                                        View Product
                                    </a>

                                    <button
                                        onClick={() => setEditingProduct(product)}
                                        disabled={!isSubscriptionActive}
                                        className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 text-sm font-semibold rounded hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>

                                    {product.is_verified && !product.is_sme_certified && (
                                        <SMECertificationModal productId={product.id} productTitle={product.title} />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingProduct && (
                <ProductEditModal
                    productId={editingProduct.id}
                    productTitle={editingProduct.title}
                    currentBuyUrl={editingProduct.buy_url}
                    currentDiscountCode={editingProduct.discount_code}
                    isSubscriptionActive={isSubscriptionActive}
                    onClose={() => setEditingProduct(null)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}
