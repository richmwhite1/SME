"use client";

import { useEffect, useState } from "react";
import { trackProductView } from "@/app/actions/track-product-view";

interface ProductViewTrackerProps {
    productId: string;
    isVerified: boolean;
}

/**
 * Client component to track product views for metered billing
 * Only tracks views for verified products
 */
export default function ProductViewTracker({ productId, isVerified }: ProductViewTrackerProps) {
    const [tracked, setTracked] = useState(false);

    useEffect(() => {
        // Only track verified products
        if (!isVerified || tracked) {
            return;
        }

        const cookieName = `product_view_${productId}`;

        // Check if we already tracked this view recently
        const existingCookie = getCookie(cookieName);

        if (existingCookie) {
            const timestamp = parseInt(existingCookie);
            const age = Date.now() - timestamp;
            const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

            if (age < fiveMinutes) {
                // Recent visit - skip tracking
                console.log(`⏭️ Skipping duplicate view for product ${productId} (${Math.round(age / 1000)}s ago)`);
                setTracked(true);
                return;
            }
        }

        // Track the view
        async function track() {
            try {
                const result = await trackProductView(productId);

                if (result.success) {
                    console.log(`✅ Tracked view for product ${productId}`);

                    // Set cookie to prevent duplicate tracking
                    setCookie(cookieName, Date.now().toString(), {
                        maxAge: 5 * 60, // 5 minutes
                        path: '/',
                        sameSite: 'lax'
                    });

                    setTracked(true);
                } else {
                    console.log(`ℹ️ View not tracked: ${result.reason || 'Unknown reason'}`);
                }
            } catch (error) {
                console.error('Failed to track product view:', error);
            }
        }

        track();
    }, [productId, isVerified, tracked]);

    // This component doesn't render anything
    return null;
}

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }

    return null;
}

/**
 * Set cookie with options
 */
function setCookie(name: string, value: string, options: {
    maxAge?: number;
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
}) {
    if (typeof document === 'undefined') return;

    let cookieString = `${name}=${value}`;

    if (options.maxAge) {
        cookieString += `; max-age=${options.maxAge}`;
    }

    if (options.path) {
        cookieString += `; path=${options.path}`;
    }

    if (options.sameSite) {
        cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
}
