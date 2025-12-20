import Link from "next/link";

interface SearchFiltersProps {
  currentFilter: string;
  query: string;
}

export default function SearchFilters({ currentFilter, query }: SearchFiltersProps) {
  const baseUrl = `/search?q=${encodeURIComponent(query)}`;

  const filters = [
    { value: "all", label: "All Results" },
    { value: "certified", label: "SME Certified Only" },
    { value: "products", label: "Products" },
    { value: "discussions", label: "Discussions" },
    { value: "resources", label: "Resources" },
  ];

  return (
    <div className="space-y-1">
      {filters.map((filter) => {
        const isActive = currentFilter === filter.value;
        const url = filter.value === "all" 
          ? baseUrl 
          : `${baseUrl}&filter=${filter.value}`;
        
        return (
          <Link
            key={filter.value}
            href={url}
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}

