"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  defaultOption?: string;
  className?: string;
}

export default function SortDropdown({
  options,
  defaultOption = options[0]?.value,
  className = "",
}: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(
    searchParams.get("sort") || defaultOption
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    setSelected(value);
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultOption) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`?${params.toString()}`);
  };

  const selectedOption = options.find((opt) => opt.value === selected);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors font-mono uppercase tracking-wider"
      >
        <span>Sort: {selectedOption?.label || "Select"}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-sm border border-slate-200 bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-left text-xs transition-colors font-mono uppercase tracking-wider ${
                selected === option.value
                  ? "bg-[#F8FAFC] text-[#B8860B]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}





