"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, BookOpen, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ResourceReference {
  resource_id: string;
  resource_title: string;
  resource_url: string | null;
}

interface CitationInputProps {
  onAddReference: (reference: ResourceReference) => void;
  onRemoveReference?: (resourceId: string) => void;
  references: ResourceReference[];
  maxReferences?: number;
}

export default function CitationInput({
  onAddReference,
  onRemoveReference,
  references,
  maxReferences = 5,
}: CitationInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search resource_library
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("resource_library")
          .select("origin_id, title, reference_url")
          .ilike("title", `%${query.trim()}%`)
          .limit(10);

        if (error) {
          console.error("Search error:", error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelectReference = (resource: any) => {
    // Check if already added
    if (references.some((ref) => ref.resource_id === resource.origin_id)) {
      return;
    }

    // Check max references
    if (references.length >= maxReferences) {
      return;
    }

    onAddReference({
      resource_id: resource.origin_id,
      resource_title: resource.title,
      resource_url: resource.reference_url,
    });

    setQuery("");
    setIsOpen(false);
  };

  const handleRemoveReference = (resourceId: string) => {
    // This will be handled by parent component
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Citation Input */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bone-white/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Add citation from SME Citations..."
          className="w-full text-xs bg-forest-obsidian border border-translucent-emerald py-1.5 pl-8 pr-8 text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-white/50 hover:text-bone-white"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full z-50 mt-1 w-full border border-translucent-emerald bg-muted-moss max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="text-xs text-bone-white/70 font-mono">Searching...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-bone-white/70 font-mono">No evidence found</p>
            </div>
          ) : (
            <div className="py-1">
              {results.map((resource) => {
                const isAdded = references.some((ref) => ref.resource_id === resource.origin_id);
                return (
                  <button
                    key={resource.origin_id}
                    type="button"
                    onClick={() => !isAdded && handleSelectReference(resource)}
                    disabled={isAdded || references.length >= maxReferences}
                    className={`w-full px-3 py-2 text-left transition-colors border-b border-translucent-emerald last:border-b-0 ${
                      isAdded
                        ? "bg-forest-obsidian/50 text-bone-white/30 cursor-not-allowed"
                        : "hover:bg-forest-obsidian text-bone-white"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <BookOpen size={12} className="text-bone-white/70 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{resource.title}</p>
                        {resource.reference_url && (
                          <p className="text-[10px] text-bone-white/50 font-mono truncate mt-0.5">
                            {resource.reference_url}
                          </p>
                        )}
                      </div>
                      {isAdded && (
                        <span className="text-[10px] text-bone-white/50 font-mono">Added</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected References Tags */}
      {references.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {references.map((ref) => (
            <div
              key={ref.resource_id}
              className="group flex items-center gap-1.5 border border-translucent-emerald bg-forest-obsidian px-2 py-1 text-xs font-mono"
            >
              <BookOpen size={10} className="text-bone-white/70" />
              <span className="text-bone-white/80">{ref.resource_title}</span>
              {ref.resource_url && (
                <a
                  href={ref.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-bone-white/50 hover:text-bone-white transition-colors"
                >
                  <ExternalLink size={10} />
                </a>
              )}
              {onRemoveReference && (
                <button
                  type="button"
                  onClick={() => onRemoveReference(ref.resource_id)}
                  className="ml-1 text-bone-white/50 hover:text-bone-white transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



