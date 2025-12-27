'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchSemantic, SearchFilterMode } from '@/app/actions/search-actions';
import LensResultCard from './LensResultCard';

const PLACEHOLDERS = [
    "Search for 'Better Sleep'...",
    "Search for 'Low Toxicity'...",
    "Search for 'Bio-availability'...",
    "Search for 'Gut Health'...",
    "Search for 'Energy Optimization'..."
];

export default function LensAwareSearch() {
    const [query, setQuery] = useState('');
    const [filterMode, setFilterMode] = useState<SearchFilterMode>('holistic');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Ghost text state
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Ghost text animation effect
    useEffect(() => {
        const currentPlaceholder = PLACEHOLDERS[placeholderIndex];
        const typeSpeed = isDeleting ? 50 : 100;
        const pauseTime = 2000;

        const timer = setTimeout(() => {
            if (!isDeleting && displayText === currentPlaceholder) {
                // Finished typing, pause then delete
                setTimeout(() => setIsDeleting(true), pauseTime);
            } else if (isDeleting && displayText === '') {
                // Finished deleting, move to next
                setIsDeleting(false);
                setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
            } else {
                // Typing or deleting
                const nextText = isDeleting
                    ? currentPlaceholder.substring(0, displayText.length - 1)
                    : currentPlaceholder.substring(0, displayText.length + 1);
                setDisplayText(nextText);
            }
        }, typeSpeed);

        return () => clearTimeout(timer);
    }, [displayText, isDeleting, placeholderIndex]);

    // Search logic with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                handleSearch();
            } else if (query.trim().length === 0) {
                setResults([]);
                setHasSearched(false);
            }
        }, 600);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, filterMode]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await searchSemantic(query, filterMode);
            setResults(data);
            setHasSearched(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="w-full max-w-7xl mx-auto py-16 px-6" id="lens-search">
            {/* Search Header */}
            <div className="flex flex-col items-center mb-16 space-y-10">


                {/* Input */}
                <div className="relative w-full max-w-3xl group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        {loading ? (
                            <Loader2 className="w-6 h-6 text-sme-gold animate-spin" />
                        ) : (
                            <Search className="w-6 h-6 text-white/30 group-focus-within:text-sme-gold transition-colors" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={displayText}
                        className="w-full bg-black/20 border-b-2 border-white/10 text-xl md:text-3xl py-8 pl-16 pr-4 text-bone-white placeholder:text-white/20 focus:outline-none focus:border-sme-gold transition-all font-serif backdrop-blur-sm"
                    />
                    {/* Static placeholder for layout stability if needed, but input placeholder handles it */}
                </div>

                {/* Segmented Control Toggle */}
                <div className="flex bg-forest-obsidian/50 p-1 rounded-full border border-translucent-emerald/30 overflow-hidden backdrop-blur-sm">
                    <FilterButton
                        active={filterMode === 'verified'}
                        onClick={() => setFilterMode('verified')}
                        label="Scientific Evidence"
                    />
                    <FilterButton
                        active={filterMode === 'holistic'}
                        onClick={() => setFilterMode('holistic')}
                        label="All Results"
                    />
                    <FilterButton
                        active={filterMode === 'community'}
                        onClick={() => setFilterMode('community')}
                        label="Community Insights"
                    />
                </div>
            </div>

            {/* Results */}
            {results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {results.map((item) => (
                        <LensResultCard key={`${item.result_type}-${item.result_id}`} product={mapResultToCardProps(item)} />
                    ))}
                </div>
            ) : (
                hasSearched && !loading && (
                    <div className="text-center py-12 opacity-40">
                        <p className="text-bone-white text-lg font-mono">No results found matching your criteria.</p>
                    </div>
                )
            )}
        </section>
    );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all duration-300 ${active
                ? 'bg-sme-gold text-forest-obsidian font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-bone-white/60 hover:text-bone-white hover:bg-white/5'
                }`}
        >
            {label}
        </button>
    );
}

// Helper to map mixed search results to the card component props
// Ideally LensResultCard should be updated to handle generic SearchResult directly
function mapResultToCardProps(item: any) {
    // If it's a product result, it fits mostly
    // If it's a discussion, we need to adapt it
    return {
        id: item.result_id,
        title: item.title,
        problem_solved: item.snippet || item.content, // Use snippet if available
        is_sme_certified: item.is_sme_certified,
        score_scientific: item.score_scientific || 0,
        score_alternative: item.score_alternative || 0,
        score_esoteric: item.score_esoteric || 0,
        images: null,
        relevance_score: item.relevance_score,
        result_type: item.result_type, // Pass the type explicitly
        slug: item.result_slug || item.slug // Map result_slug to slug, fallback to slug
    };
}
