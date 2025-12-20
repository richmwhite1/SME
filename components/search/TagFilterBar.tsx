"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopicBadge from "@/components/topics/TopicBadge";

interface TagFilterBarProps {
  tags: string[];
  selectedTag?: string | null;
  className?: string;
}

export default function TagFilterBar({
  tags,
  selectedTag,
  className = "",
}: TagFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedTag === tag) {
      params.delete("topic");
    } else {
      params.set("topic", tag);
    }
    router.push(`?${params.toString()}`);
  };

  if (tags.length === 0) return null;

  return (
    <div className={`${className}`}>
      <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
        Filter by Tag
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              selectedTag === tag
                ? "border-[#B8860B] bg-[#B8860B]/10 text-[#B8860B]"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}





