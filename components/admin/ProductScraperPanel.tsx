'use client';

import { useState } from 'react';
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import Link from 'next/link';

interface ScrapeResponse {
    success?: boolean;
    duplicate?: boolean;
    message?: string;
    error?: string;
    product?: {
        id: string;
        title: string;
        slug: string;
        status: string;
    };
    existingProduct?: {
        id: string;
        title: string;
        slug: string;
        status: string;
    };
}

export default function ProductScraperPanel() {
    const [productUrl, setProductUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScrapeResponse | null>(null);

    const handleScrape = async () => {
        if (!productUrl.trim()) {
            setResult({ error: 'Please enter a product URL' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/admin/scrape-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productUrl: productUrl.trim() }),
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error scraping product:', error);
            setResult({ error: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleScrape();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-bone-white/20 pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <Package className="h-6 w-6 text-emerald-400" />
                    <h2 className="font-mono text-xl font-bold text-bone-white">
                        Product Scraper
                    </h2>
                </div>
                <p className="font-mono text-sm text-bone-white/70">
                    Extract product information from any URL and add it to the database as an unclaimed product.
                </p>
            </div>

            {/* Input Section */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="product-url" className="block font-mono text-sm text-bone-white/70 mb-2">
                        Product URL
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bone-white/50" />
                            <input
                                id="product-url"
                                type="url"
                                value={productUrl}
                                onChange={(e) => setProductUrl(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="https://example.com/product-page"
                                disabled={loading}
                                className="w-full bg-bone-white/5 border border-bone-white/20 text-bone-white font-mono text-sm px-10 py-2.5 focus:outline-none focus:border-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <button
                            onClick={handleScrape}
                            disabled={loading || !productUrl.trim()}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-bone-white/10 disabled:cursor-not-allowed text-bone-white font-mono text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Scraping...
                                </>
                            ) : (
                                'Scrape Product'
                            )}
                        </button>
                    </div>
                </div>

                {/* Result Messages */}
                {result && (
                    <div className="space-y-3">
                        {/* Success Message */}
                        {result.success && result.product && (
                            <div className="border border-emerald-500/30 bg-emerald-500/10 p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <p className="font-mono text-sm text-emerald-400 font-semibold">
                                            {result.message || 'Product added successfully'}
                                        </p>
                                        <div className="font-mono text-xs text-bone-white/70 space-y-1">
                                            <p>
                                                <span className="text-bone-white/50">Title:</span>{' '}
                                                <span className="text-bone-white">{result.product.title}</span>
                                            </p>
                                            <p>
                                                <span className="text-bone-white/50">Status:</span>{' '}
                                                <span className="text-emerald-400">{result.product.status}</span>
                                            </p>
                                        </div>
                                        <Link
                                            href={`/products/${result.product.slug}`}
                                            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-mono text-sm transition-colors"
                                        >
                                            View Product →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Duplicate Message */}
                        {result.duplicate && result.existingProduct && (
                            <div className="border border-yellow-500/30 bg-yellow-500/10 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <p className="font-mono text-sm text-yellow-400 font-semibold">
                                            Product already exists
                                        </p>
                                        <div className="font-mono text-xs text-bone-white/70 space-y-1">
                                            <p>
                                                <span className="text-bone-white/50">Title:</span>{' '}
                                                <span className="text-bone-white">{result.existingProduct.title}</span>
                                            </p>
                                            <p>
                                                <span className="text-bone-white/50">Status:</span>{' '}
                                                <span className="text-yellow-400">{result.existingProduct.status}</span>
                                            </p>
                                        </div>
                                        <Link
                                            href={`/products/${result.existingProduct.slug}`}
                                            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-mono text-sm transition-colors"
                                        >
                                            View Existing Product →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {result.error && (
                            <div className="border border-red-500/30 bg-red-500/10 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-mono text-sm text-red-400 font-semibold mb-1">
                                            Scraping failed
                                        </p>
                                        <p className="font-mono text-xs text-bone-white/70">
                                            {result.error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="border border-bone-white/10 bg-bone-white/5 p-4">
                <h3 className="font-mono text-sm font-semibold text-bone-white mb-2">
                    How to use:
                </h3>
                <ul className="font-mono text-xs text-bone-white/70 space-y-1.5 list-disc list-inside">
                    <li>Paste a product URL from any e-commerce site or brand website</li>
                    <li>AI will extract: name, description, ingredients, and brand name</li>
                    <li>Product will be added with status &quot;unclaimed&quot;</li>
                    <li>Duplicate products are detected automatically by slug</li>
                </ul>
            </div>
        </div>
    );
}
