"use client";

import { useRouter, useSearchParams } from "next/navigation";
import LocalSearchBar from "@/components/search/LocalSearchBar";

interface DiscussionsClientProps {
  searchQuery: string;
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

  return (
    <LocalSearchBar
      placeholder="Search discussions by title or content..."
      onSearch={handleSearch}
      className="w-full"
    />
  );
}





