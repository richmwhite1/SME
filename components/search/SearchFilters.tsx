export default function SearchFilters({ currentFilter, query }: SearchFiltersProps) {
  const baseUrl = `/search?q=${encodeURIComponent(query)}`;

  // Parse current filter to separate Type and Perspective if needed
  // For now, let's treat them as separate URL params?
  // The current implementation uses ?filter=VALUE.
  // I should probably switch to ?type=VALUE&perspective=VALUE but that requires changing page.tsx props interface first.
  // To stay compatible with current page.tsx (which reads searchParams.filter), I will just add new distinct values 
  // OR allow page.tsx to read 'perspective' param too.
  // Let's assume page.tsx will be updated to read 'perspective'.

  // We need to access searchParams in client component? No, this is server rendered?
  // It is imported in page.tsx as a client component? No, it has no 'use client'.
  // But wait, it uses 'Link' which is fine.
  // Let's check if SearchFilters is server or client. It has no directive, so passing props is fine.
  // I will check SearchFiltersProps. It receives `currentFilter`.

  // I will update SearchFilters to accept `currentPerspective` props.
  // But I can't change the usage in page.tsx yet.

  // Let's just add the links with `&perspective=...` and rely on page.tsx update.
}

// Rewriting the component entirely to handle the prop change logic in one go would be cleaner, 
// BUT I am using replace_file_content on a small file.
// I will rewrite the whole file content to be safe.

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

