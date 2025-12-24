"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import LocalSearchBar from "@/components/search/LocalSearchBar";

interface ProductsClientProps {
  searchQuery: string;
}

export default function ProductsClient({
  searchQuery,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <LocalSearchBar
      placeholder="Search products by name or ingredient..."
      onSearch={handleSearch}
      className="w-full"
    />
  );
}





