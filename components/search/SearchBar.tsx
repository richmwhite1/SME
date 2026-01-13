"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FlaskConical, MessageSquare, BookOpen, Award, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { searchGlobal } from "@/app/actions/search-actions";

interface SearchResult {
  result_type: "Product" | "Discussion" | "Resource" | "Evidence";
  result_id: string;
  result_slug: string;
  title: string;
  content: string;
  snippet?: string | null;
  content_snippet?: string | null; // Content snippet from RPC
  created_at: string;
  author_name: string;
  author_username: string | null;
  is_sme_certified: boolean;
  relevance_score: number;
}

interface SearchBarProps {
  onExpand?: () => void;
  onCollapse?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ onExpand, onCollapse, autoFocus = false }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Command-K and Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        onCollapse?.();
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCollapse]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onCollapse?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCollapse]);

  // Search as user types
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSynthesis(null);
      setIsOpen(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      setSynthesis(null); // Clear previous synthesis while loading

      try {
        // Call server action for search
        const { results: data, synthesis: aiSummary } = await searchGlobal(query.trim(), 5);

        // Debug: Log search results
        console.log("Search Results:", data);
        console.log("AI Synthesis:", aiSummary);

        if (aiSummary) setSynthesis(aiSummary);

        // Sort results: exact title matches first, then by relevance
        const sortedResults = ((data || []) as SearchResult[]).sort((a, b) => {
          const aExactTitle = a.title.toLowerCase() === query.toLowerCase();
          const bExactTitle = b.title.toLowerCase() === query.toLowerCase();
          if (aExactTitle && !bExactTitle) return -1;
          if (!aExactTitle && bExactTitle) return 1;
          return b.relevance_score - a.relevance_score;
        });
        setResults(sortedResults);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
        setSynthesis(null);
      } finally {
        setLoading(false);
      }
    }, 500); // Increased Debounce to 500ms for AI cost/perf

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      onCollapse?.();
      setQuery("");
    }
  };

  const handleResultClick = (result: SearchResult) => {
    let url = "";
    if (result.result_type === "Product") {
      url = `/products/${result.result_id}`;
    } else if (result.result_type === "Discussion") {
      // Route to /community/[id] which redirects to /discussions/[slug]
      url = `/community/${result.result_id}`;
    } else if (result.result_type === "Evidence" || result.result_type === "Resource") {
      // Route to SME Citations
      url = `/resources`;
    }

    if (url) {
      router.push(url);
      setIsOpen(false);
      onCollapse?.();
      setQuery("");
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "Product":
        return <FlaskConical size={14} className="text-heart-green" />;
      case "Discussion":
        return <MessageSquare size={14} className="text-third-eye-indigo" />;
      case "Resource":
      case "Evidence":
        return <BookOpen size={14} className="text-bone-white/70" />;
      default:
        return null;
    }
  };

  const getCategoryTag = (type: string) => {
    // Map result types to display categories
    const categoryMap: Record<string, string> = {
      "Product": "PRODUCT",
      "Discussion": "COMMUNITY",
      "Resource": "EVIDENCE",
      "Evidence": "EVIDENCE",
    };
    const category = categoryMap[type] || type.toUpperCase();

    const colors: Record<string, string> = {
      "Product": "text-heart-green",
      "Discussion": "text-third-eye-indigo",
      "Resource": "text-bone-white/70",
      "Evidence": "text-bone-white/70",
    };
    return { category, color: colors[type] || "text-bone-white/70" };
  };

  // Highlight search term in text with soft gold background (20% opacity)
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    // Escape special regex characters
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-sme-gold/20 text-bone-white font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Group results by type
  const groupedResults = results
    .filter(r => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Products") return r.result_type === "Product";
      if (activeFilter === "Discussions") return r.result_type === "Discussion";
      if (activeFilter === "Evidence") return r.result_type === "Resource" || r.result_type === "Evidence";
      return true;
    })
    .reduce(
      (acc, result) => {
        if (!acc[result.result_type]) {
          acc[result.result_type] = [];
        }
        acc[result.result_type].push(result);
        return acc;
      },
      {} as Record<string, SearchResult[]>
    );

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Filter Chips */}
      <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 no-scrollbar">
        {["All", "Products", "Discussions", "Evidence"].map((filter) => {
          const isSelected = (activeFilter === "All" && filter === "All") ||
            (activeFilter === filter);
          return (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setActiveFilter(filter);
                inputRef.current?.focus();
              }}
              className={`
                px-3 py-1 text-[10px] uppercase tracking-wider font-mono rounded-full border transition-all
                ${isSelected
                  ? "bg-sme-gold text-forest-obsidian border-sme-gold font-bold"
                  : "bg-transparent text-bone-white/60 border-translucent-emerald hover:border-sme-gold/50 hover:text-bone-white"}
              `}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {/* Subtle search icon */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bone-white/50">
            <Search size={14} />
          </div>
          {/* Command Palette Style Input - Apothecary Terminal */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length >= 2) setIsOpen(true);
              onExpand?.();
            }}
            placeholder={activeFilter === 'All' ? "search products, discussions & evidence..." : `search ${activeFilter.toLowerCase()}...`}
            suppressHydrationWarning
            className="w-full text-sm bg-muted-moss border border-translucent-emerald py-3 pl-9 pr-16 text-bone-white placeholder-bone-white/30 focus:border-heart-green focus:outline-none transition-all font-mono shadow-inner shadow-black/20 rounded-md"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                onCollapse?.(); // Optionally collapse on clear
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs text-bone-white/50 hover:text-bone-white font-mono"
            >
              ×
            </button>
          )}
          {/* Command-K hint - subtle */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-bone-white/30 text-[10px] font-mono border border-bone-white/10 px-1.5 py-0.5 rounded">
            ⌘K
          </div>
        </div>
      </form>

      {/* Dropdown Results - Apothecary Terminal */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 z-[9999] mt-2 w-full border border-translucent-emerald bg-muted-moss shadow-2xl overflow-hidden ring-1 ring-black/5">
          {/* Debug: {results.length} results found */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={18} className="animate-spin text-bone-white/70" />
            </div>
          ) : (results.length === 0 && !synthesis) ? (
            <div className="p-6 text-center border-b border-translucent-emerald">
              <p className="text-xs text-bone-white/70 font-mono mb-2">
                No Signal Found
              </p>
              <p className="text-[10px] text-bone-white/50 font-mono">
                Start a Discussion about this topic
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {/* AI Synthesis Section */}
              {synthesis && (
                <div className="p-4 bg-forest-obsidian/80 border-b border-translucent-emerald backdrop-blur-sm">
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={16} className="text-sme-gold flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-[10px] font-mono text-sme-gold uppercase tracking-wider mb-1 font-bold">Laboratory Insight</h4>
                      <p className="text-xs text-bone-white leading-relaxed font-sans">{synthesis}</p>
                    </div>
                  </div>
                </div>
              )}

              {Object.entries(groupedResults).map(([type, typeResults]) => {
                const { category, color } = getCategoryTag(type);
                return (
                  <div key={type} className="border-b border-translucent-emerald last:border-b-0">
                    <div className="bg-forest-obsidian/80 px-3 py-2 border-b border-translucent-emerald/50 flex items-center gap-2">
                      <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${color}`}>
                        {category}
                      </span>
                      <span className="text-[10px] text-bone-white/30 font-mono">
                        ({typeResults.length})
                      </span>
                    </div>
                    {typeResults.map((result, index) => (
                      <button
                        key={`${result.result_id}-${index}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-3 py-2.5 text-left transition-colors hover:bg-forest-obsidian/50 border-b border-translucent-emerald/30 last:border-b-0 group"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                            {getResultIcon(result.result_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-bone-white truncate group-hover:text-sme-gold transition-colors">
                                {highlightText(result.title, query)}
                              </span>
                              {result.is_sme_certified && result.result_type === "Product" && (
                                <div className="flex-shrink-0">
                                  <Award size={12} className="text-sme-gold" />
                                </div>
                              )}
                            </div>
                            {/* Display content_snippet (or snippet) below title */}
                            {(result.content_snippet || result.snippet) ? (
                              <p className="text-xs text-bone-white/60 line-clamp-2 font-mono leading-relaxed mb-1 group-hover:text-bone-white/80 transition-colors">
                                {highlightText(result.content_snippet || result.snippet || "", query)}
                              </p>
                            ) : (
                              <p className="text-xs text-bone-white/60 line-clamp-1 font-mono mb-1 group-hover:text-bone-white/80 transition-colors">
                                {highlightText(result.content.substring(0, 70), query)}
                                {result.content.length > 70 ? "..." : ""}
                              </p>
                            )}
                            {result.author_name && (
                              <p className="mt-0.5 text-[10px] text-bone-white/40 font-mono">
                                by {result.author_name}
                                {result.author_username && ` @${result.author_username}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
              {results.length > 0 && (
                <div className="border-t border-translucent-emerald bg-forest-obsidian px-3 py-2">
                  <button
                    onClick={handleSubmit}
                    className="w-full text-left text-xs font-medium text-bone-white/80 hover:text-bone-white font-mono flex items-center gap-1 group"
                  >
                    View all results for &quot;{query}&quot; <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
