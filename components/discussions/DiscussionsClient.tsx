"use client";

import { useRouter, useSearchParams } from "next/navigation";
import LocalSearchBar from "@/components/search/LocalSearchBar";

interface DiscussionsClientProps {
  searchQuery: string;
  sort: string;
}

export default function DiscussionsClient({
  searchQuery,
}: DiscussionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <LocalSearchBar
          placeholder="Search discussions..."
          onSearch={handleSearch}
          className="w-full"
        />
      </div>
      <div className="flex-shrink-0">
        <select
          value={searchParams.get("sort") || "newest"}
          onChange={(e) => handleSortChange(e.target.value)}
          className="h-10 w-full rounded border border-translucent-emerald bg-forest-obsidian px-3 text-sm text-bone-white focus:border-sme-gold outline-none cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="active">Most Active</option>
          <option value="upvotes">Highest Upvoted</option>
          <option value="popularity">Popularity</option>
        </select>
      </div>
    </div>
  );
}





