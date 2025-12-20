"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface TopicSearchProps {
  topicName: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount?: number;
}

export default function TopicSearch({
  topicName,
  searchQuery,
  onSearchChange,
  resultCount,
}: TopicSearchProps) {
  const handleClear = () => {
    onSearchChange("");
  };

  return (
    <div className="mb-6">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-deep-stone/40"
          size={20}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          placeholder={`Search within #${topicName}...`}
          className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-10 py-3 text-deep-stone placeholder:text-deep-stone/40 focus:border-earth-green/50 focus:outline-none focus:ring-2 focus:ring-earth-green/20"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-deep-stone/40 hover:text-deep-stone"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {searchQuery && resultCount !== undefined && (
        <p className="mt-2 text-sm text-deep-stone/60">
          {resultCount} result{resultCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
}




