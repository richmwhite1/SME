"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface TagWithCount {
  tag: string;
  count: number;
}

interface TagSidebarProps {
  tags: TagWithCount[];
  selectedTag?: string | null;
  className?: string;
}

export default function TagSidebar({
  tags,
  selectedTag,
  className = "",
}: TagSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return tags;
    const query = tagSearchQuery.toLowerCase();
    return tags.filter((t) => t.tag.toLowerCase().includes(query));
  }, [tags, tagSearchQuery]);

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedTag === tag) {
      params.delete("topic");
    } else {
      params.set("topic", tag);
    }
    // Preserve other params like search and trusted
    router.push(`?${params.toString()}`);
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("topic");
    router.push(`?${params.toString()}`);
  };

  if (tags.length === 0) return null;

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-4 border-b border-slate-200 pb-3">
        <h3 className="mb-3 text-xs font-mono uppercase tracking-wider text-slate-900">
          Filter by Topic
        </h3>
        
        {/* Clear Filters Button - Only show when tag is selected */}
        {selectedTag && (
          <button
            onClick={handleClearFilters}
            className="mb-3 w-full rounded-sm border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        )}

        {/* Tag Search Input */}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={tagSearchQuery}
            onChange={(e) => setTagSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full rounded-sm border border-slate-200 bg-white px-7 py-1.5 text-[10px] text-slate-900 placeholder-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 font-mono"
          />
          {tagSearchQuery && (
            <button
              onClick={() => setTagSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Tags List - Vertical on desktop, horizontal scroll on mobile */}
      <div className="space-y-1">
        {/* Desktop: Vertical List */}
        <div className="hidden lg:block">
          {filteredTags.length === 0 ? (
            <p className="text-[10px] text-slate-500 font-mono">
              No tags found
            </p>
          ) : (
            filteredTags.map((tagData) => {
              const isActive = selectedTag === tagData.tag;
              return (
                <button
                  key={tagData.tag}
                  onClick={() => handleTagClick(tagData.tag)}
                  className={`w-full rounded-sm border px-2 py-1.5 text-left transition-colors ${
                    isActive
                      ? "border-[#B8860B] bg-[#B8860B]/10 text-[#B8860B]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider"
                      style={{ fontVariant: "small-caps" }}
                    >
                      #{tagData.tag}
                    </span>
                    <span
                      className={`text-[9px] font-mono ${
                        isActive ? "text-[#B8860B]/70" : "text-slate-400"
                      }`}
                    >
                      {tagData.count}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filteredTags.length === 0 ? (
              <p className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                No tags found
              </p>
            ) : (
              filteredTags.map((tagData) => {
                const isActive = selectedTag === tagData.tag;
                return (
                  <button
                    key={tagData.tag}
                    onClick={() => handleTagClick(tagData.tag)}
                    className={`flex-shrink-0 rounded-sm border px-2.5 py-1.5 transition-colors ${
                      isActive
                        ? "border-[#B8860B] bg-[#B8860B]/10 text-[#B8860B]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider whitespace-nowrap"
                        style={{ fontVariant: "small-caps" }}
                      >
                        #{tagData.tag}
                      </span>
                      <span
                        className={`text-[9px] font-mono ${
                          isActive ? "text-[#B8860B]/70" : "text-slate-400"
                        }`}
                      >
                        {tagData.count}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Show count of filtered tags */}
      {tagSearchQuery && (
        <p className="mt-3 text-[9px] text-slate-500 font-mono">
          {filteredTags.length} tag{filteredTags.length !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
}





