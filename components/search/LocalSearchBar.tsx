"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface LocalSearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export default function LocalSearchBar({
  placeholder = "Search...",
  onSearch,
  className = "",
}: LocalSearchBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-sm border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 font-mono"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              onSearch("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}





