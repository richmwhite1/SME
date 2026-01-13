import Link from "next/link";
import { Filter, Microscope, Leaf } from "lucide-react";

interface SearchFiltersProps {
  currentFilter: string; // The active 'type' filter
  currentPerspective?: string; // 'all', 'scientific', 'holistic'
  query: string;
}

export default function SearchFilters({ currentFilter, currentPerspective = "all", query }: SearchFiltersProps) {
  const getUrl = (type: string, perspective: string) => {
    return `/search?q=${encodeURIComponent(query)}&filter=${type}&perspective=${perspective}`;
  };

  const types = [
    { value: "all", label: "All Results" },
    { value: "certified", label: "SME Certified" },
    { value: "products", label: "Products" },
    { value: "discussions", label: "Discussions" },
    { value: "resources", label: "Resources" },
  ];

  const perspectives = [
    { value: "all", label: "Any Perspective" },
    { value: "scientific", label: "Scientific", icon: Microscope },
    { value: "holistic", label: "Holistic", icon: Leaf },
  ];

  return (
    <div className="space-y-6">
      {/* Type Filters */}
      <div>
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-bone-white/50 mb-2">Content Type</h3>
        <div className="space-y-1">
          {types.map((type) => {
            const isActive = currentFilter === type.value;
            const url = getUrl(type.value, currentPerspective);

            return (
              <Link
                key={type.value}
                href={url}
                className={`block rounded-md px-3 py-2 text-sm transition-colors font-mono ${isActive
                  ? "bg-forest-obsidian border border-sme-gold text-sme-gold font-bold"
                  : "text-bone-white/70 hover:bg-forest-obsidian hover:text-bone-white border border-transparent"
                  }`}
              >
                {type.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Perspective Filters */}
      <div>
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-bone-white/50 mb-2">Perspective</h3>
        <div className="space-y-1">
          {perspectives.map((p) => {
            const isActive = currentPerspective === p.value;
            const url = getUrl(currentFilter, p.value);
            const Icon = p.icon;

            return (
              <Link
                key={p.value}
                href={url}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors font-mono ${isActive
                  ? `bg-forest-obsidian border font-bold ${p.value === 'scientific' ? 'border-third-eye-indigo text-third-eye-indigo' : p.value === 'holistic' ? 'border-heart-green text-heart-green' : 'border-bone-white/50 text-bone-white'}`
                  : "text-bone-white/70 hover:bg-forest-obsidian hover:text-bone-white border border-transparent"
                  }`}
              >
                {Icon && <Icon size={14} />}
                {p.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
