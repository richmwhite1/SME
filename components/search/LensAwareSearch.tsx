'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchProductsByLens, LensSearchResult } from '@/app/actions/search-actions';
import LensResultCard from './LensResultCard';

type LensType = 'scientific' | 'ancestral' | 'esoteric';

export default function LensAwareSearch() {
    const [query, setQuery] = useState('');
    // Corrected default lens to 'scientific' as per prompt instructions implicitly or explicitly
    const [lens, setLens] = useState<LensType>('scientific');
    const [results, setResults] = useState<LensSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                handleSearch();
            } else if (query.trim().length === 0) {
                setResults([]);
                setHasSearched(false);
            }
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, lens]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await searchProductsByLens(query, lens);
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
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-5xl font-serif text-bone-white">
                        Find Your Formulation
                    </h2>
                    <p className="text-white/40 font-mono text-sm uppercase tracking-widest">
                        Search through the lens of truth
                    </p>
                </div>

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
                        placeholder="Search by symptom, ingredient, or goal..."
                        className="w-full bg-black/20 border-b-2 border-white/10 text-xl md:text-3xl py-8 pl-16 pr-4 text-bone-white placeholder:text-white/20 focus:outline-none focus:border-sme-gold transition-all font-serif backdrop-blur-sm"
                    />
                </div>

                {/* Lens Toggles */}
                <div className="flex flex-wrap justify-center gap-4">
                    <LensToggle
                        active={lens === 'scientific'}
                        onClick={() => setLens('scientific')}
                        icon="🧬"
                        label="Scientific-Heavy"
                        description="Empirical Data & Clinical Trials"
                    />
                    <LensToggle
                        active={lens === 'ancestral'}
                        onClick={() => setLens('ancestral')}
                        icon="🪵"
                        label="Ancestral/Alt"
                        description="Time-Tested Wisdom"
                    />
                    <LensToggle
                        active={lens === 'esoteric'}
                        onClick={() => setLens('esoteric')}
                        icon="👁️"
                        label="Esoteric-Forward"
                        description="Energetic & Subtle Body"
                    />
                </div>
            </div>

            {/* Results */}
            {results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {results.map((product) => (
                        <LensResultCard key={product.id} product={product} />
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

function LensToggle({ active, onClick, icon, label, description }: any) {
    const activeClasses = active
        ? "bg-forest-obsidian border-sme-gold text-white shadow-[0_0_20px_rgba(212,175,55,0.15)] scale-105"
        : "bg-transparent border-white/5 text-white/40 hover:border-white/20 hover:text-white/60";

    return (
        <button
            onClick={onClick}
            className={`relative group flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-xl border transition-all duration-300 min-w-[140px] ${activeClasses}`}
        >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
            <div className="flex flex-col items-center">
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold">{label}</span>
                {active && (
                    <span className="text-[9px] text-white/50 mt-1 animate-in fade-in duration-300 hidden sm:block">
                        {description}
                    </span>
                )}
            </div>
        </button>
    )
}
