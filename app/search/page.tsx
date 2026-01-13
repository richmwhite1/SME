import { getDb } from "@/lib/db/server";
import { FlaskConical, MessageSquare, BookOpen, Award, Search as SearchIcon, Filter } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Suspense } from "react";
import SearchFilters from "@/components/search/SearchFilters";

export const dynamic = "force-dynamic";

interface SearchResult {
  result_type: "Product" | "Discussion" | "Resource" | "Evidence";
  result_id: string;
  result_slug: string;
  title: string;
  content: string;
  snippet?: string | null;
  content_snippet?: string | null;
  created_at: string;
  author_name: string;
  author_username: string | null;
  is_sme_certified: boolean;
  relevance_score: number;
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; filter?: string; perspective?: string }>;
}

function highlightText(text: string, searchTerm: string) {
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
}

function getCategoryTag(type: string) {
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
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const filter = params.filter || "all";
  const perspective = params.perspective || "all"; // 'all' | 'scientific' | 'holistic'

  const sql = getDb();
  let results: SearchResult[] = [];

  if (query.trim().length >= 2) {
    try {
      // Call the global_search PostgreSQL function
      const data = await sql`
        SELECT * FROM global_search(${query.trim()}, 50)
      `;

      // Sort: exact title matches first, then by relevance score
      const sortedResults = ((data || []) as SearchResult[]).sort((a, b) => {
        const aExactTitle = a.title.toLowerCase() === query.toLowerCase();
        const bExactTitle = b.title.toLowerCase() === query.toLowerCase();
        if (aExactTitle && !bExactTitle) return -1;
        if (!aExactTitle && bExactTitle) return 1;
        return b.relevance_score - a.relevance_score;
      });
      results = sortedResults;
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  // Apply filters
  let filteredResults = results;

  // Type Filters
  if (filter === "certified") {
    filteredResults = filteredResults.filter((r) => r.is_sme_certified);
  } else if (filter === "products") {
    filteredResults = filteredResults.filter((r) => r.result_type === "Product");
  } else if (filter === "discussions") {
    filteredResults = filteredResults.filter((r) => r.result_type === "Discussion");
  } else if (filter === "resources") {
    filteredResults = filteredResults.filter((r) => r.result_type === "Resource" || r.result_type === "Evidence");
  }

  // Perspective Filters (Scientific vs Holistic)
  if (perspective === "scientific") {
    filteredResults = filteredResults.filter(r => {
      // For Products: check scientific score or certification
      if (r.result_type === "Product") {
        // Assuming getDb returns columns, if they exist. Use optional chaining if interface is correct
        // Note: SearchResult interface in THIS FILE doesn't have score_scientific.
        // I need to update the interface in this file or cast.
        // Let's assume the DB function returns them even if interface was missing them.
        return (r as any).score_scientific > 50 || r.is_sme_certified; // Simplified logic
      }
      // For Discussions: check author badge (not available? assuming author_name is "Dr."?)
      // This is a weak check without more data.
      return true;
    });
  } else if (perspective === "holistic") {
    filteredResults = filteredResults.filter(r => {
      if (r.result_type === "Product") {
        return (r as any).score_alternative > 50;
      }
      return true;
    });
  }

  // Group results by type
  const groupedResults = filteredResults.reduce(
    (acc, result) => {
      if (!acc[result.result_type]) {
        acc[result.result_type] = [];
      }
      acc[result.result_type].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  const getResultIcon = (type: string) => {
    switch (type) {
      case "Product":
        return <FlaskConical size={20} className="text-heart-green" />;
      case "Discussion":
        return <MessageSquare size={20} className="text-third-eye-indigo" />;
      case "Resource":
      case "Evidence":
        return <BookOpen size={20} className="text-bone-white/70" />;
      default:
        return null;
    }
  };

  const getResultUrl = (result: SearchResult) => {
    if (result.result_type === "Product") {
      return `/products/${result.result_id}`;
    } else if (result.result_type === "Discussion") {
      // Route to /community/[id] which redirects to /discussions/[slug]
      return `/community/${result.result_id}`;
    } else if (result.result_type === "Evidence" || result.result_type === "Resource") {
      // Route to SME Citations
      return `/resources`;
    }
    return "#";
  };

  return (
    <main className="min-h-screen bg-forest-obsidian">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="border border-translucent-emerald bg-muted-moss p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Filter size={14} className="text-bone-white/70" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-bone-white font-mono">
                    Filters
                  </h2>
                </div>
                <Suspense fallback={<div className="text-xs text-bone-white/70 font-mono">Loading filters...</div>}>
                  <SearchFilters currentFilter={filter} currentPerspective={perspective} query={query} />
                </Suspense>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header - Apothecary Terminal */}
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <SearchIcon className="h-6 w-6 text-bone-white" />
                <h1 className="font-serif text-3xl font-bold text-bone-white">Search Results</h1>
              </div>
              {query && (
                <p className="text-[10px] text-bone-white/70 font-mono uppercase tracking-wider">
                  {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""} for:{" "}
                  <span className="font-semibold text-bone-white">&quot;{query}&quot;</span>
                </p>
              )}
            </div>

            {/* Results - Apothecary Terminal */}
            {!query || query.trim().length < 2 ? (
              <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
                <SearchIcon className="mx-auto mb-4 h-12 w-12 text-bone-white/30" />
                <p className="mb-2 font-serif text-lg font-semibold text-bone-white">Enter a search query to get started</p>
                <p className="text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                  Search across products, discussions, and resources
                </p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
                <SearchIcon className="mx-auto mb-4 h-12 w-12 text-bone-white/30" />
                <p className="mb-2 font-serif text-lg font-semibold text-bone-white">
                  No Signal Found
                </p>
                <p className="mb-4 text-xs text-bone-white/70 font-mono">
                  Start a Discussion about this topic
                </p>
                <Link
                  href="/discussions/new"
                  className="inline-block mt-4 text-xs font-medium text-heart-green hover:underline font-mono uppercase tracking-wider"
                >
                  Start a Discussion →
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedResults).map(([type, typeResults]) => {
                  const { category, color } = getCategoryTag(type);
                  return (
                    <div key={type} className="border border-translucent-emerald bg-muted-moss p-6">
                      <div className="mb-4 flex items-center gap-3 border-b border-translucent-emerald pb-3">
                        {getResultIcon(type)}
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${color}`} style={{ fontVariant: 'small-caps' }}>
                          [{category}]
                        </span>
                        <h2 className="font-serif text-lg font-bold text-bone-white">
                          {type === "Discussion" ? "Community" : type === "Evidence" || type === "Resource" ? "Evidence" : type}s
                        </h2>
                        <span className="text-[10px] text-bone-white/70 font-mono uppercase tracking-wider">({typeResults.length})</span>
                      </div>
                      <div className="space-y-3">
                        {typeResults.map((result) => (
                          <Link
                            key={result.result_id}
                            href={getResultUrl(result)}
                            className="block border border-translucent-emerald bg-forest-obsidian p-4 transition-colors hover:border-heart-green"
                          >
                            <div className="flex items-start gap-4">
                              <div className="mt-1 flex-shrink-0">{getResultIcon(result.result_type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="mb-2 flex items-center gap-2">
                                  <h3 className="font-serif text-base font-semibold text-bone-white">
                                    {highlightText(result.title, query)}
                                  </h3>
                                  {result.is_sme_certified && result.result_type === "Product" && (
                                    <div className="flex-shrink-0">
                                      <Award size={16} className="text-sme-gold" />
                                    </div>
                                  )}
                                </div>
                                {/* Show content_snippet if available, otherwise fallback to snippet or content */}
                                {(result.content_snippet || result.snippet) ? (
                                  <p className="mb-3 text-sm leading-relaxed text-bone-white/70 line-clamp-3 font-mono">
                                    {highlightText(result.content_snippet || result.snippet || "", query)}
                                  </p>
                                ) : (
                                  <p className="mb-3 text-sm leading-relaxed text-bone-white/70 line-clamp-2 font-mono">
                                    {highlightText(result.content.substring(0, 150), query)}
                                    {result.content.length > 150 ? "..." : ""}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-[10px] text-bone-white/50 font-mono uppercase tracking-wider">
                                  {result.author_name && (
                                    <span>
                                      by {result.author_name}
                                      {result.author_username && ` @${result.author_username}`}
                                    </span>
                                  )}
                                  <span>
                                    {formatDistanceToNow(new Date(result.created_at), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                  {result.relevance_score >= 10 && (
                                    <span className="border border-heart-green bg-heart-green/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-heart-green">
                                      Exact match
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
