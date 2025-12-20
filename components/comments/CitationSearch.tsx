"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, BookOpen, X } from "lucide-react";
import { searchGlobal } from "@/app/actions/search-actions";

interface SearchResult {
  result_type: string;
  result_id: string;
  result_slug: string;
  title: string;
  content: string;
  content_snippet?: string;
  created_at: string;
  author_name: string;
  author_username: string;
  is_sme_certified: boolean;
  relevance_score: number;
}

interface CitationSearchProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onSelect: (resourceId: string, resourceTitle: string) => void;
  position?: { top: number; left: number };
  onContentChange?: (newContent: string) => void;
}

export default function CitationSearch({
  textareaRef,
  onSelect,
  position,
  onContentChange,
}: CitationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Detect [[ trigger in textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      const text = target.value;
      const cursorPos = target.selectionStart || 0;
      
      // Look for [[ before cursor
      const textBeforeCursor = text.substring(0, cursorPos);
      const lastBracketIndex = textBeforeCursor.lastIndexOf("[[");
      
      if (lastBracketIndex !== -1) {
        // Check if there's a closing ]] after the [[
        const textAfterBracket = textBeforeCursor.substring(lastBracketIndex + 2);
        const closingBracketIndex = textAfterBracket.indexOf("]]");
        
        // If no closing bracket, we're in a citation search
        if (closingBracketIndex === -1) {
          const searchQuery = textAfterBracket.trim();
          setQuery(searchQuery);
          setIsOpen(true);
          
          // Calculate position for floating search
          const textareaRect = textarea.getBoundingClientRect();
          const textBeforeQuery = text.substring(0, lastBracketIndex + 2);
          const lines = textBeforeQuery.split("\n");
          const lineHeight = 20; // Approximate line height
          const lineNumber = lines.length - 1;
          const charPos = lines[lines.length - 1].length;
          
          // Position will be handled by parent component
        } else {
          setIsOpen(false);
          setQuery("");
        }
      } else {
        setIsOpen(false);
        setQuery("");
      }
    };

    textarea.addEventListener("input", handleInput);
    textarea.addEventListener("keydown", handleKeyDown);
    
    return () => {
      textarea.removeEventListener("input", handleInput);
      textarea.removeEventListener("keydown", handleKeyDown);
    };
  }, [textareaRef]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  }, [isOpen, results, selectedIndex]);

  // Search resource_library using global_search RPC
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      
      try {
        // Call server action for search
        const data = await searchGlobal(query.trim(), 10);

        // Filter to only Evidence/Resource results
        const evidenceResults = ((data || []) as SearchResult[]).filter(
          (result) => result.result_type === "Evidence" || 
                     result.result_type === "Product" || 
                     result.result_type === "Discussion"
        );
        setResults(evidenceResults);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, textareaRef]);

  const handleSelectResult = (result: SearchResult) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Use setTimeout to ensure we have the latest cursor position
    setTimeout(() => {
      const text = textarea.value;
      const cursorPos = textarea.selectionStart || text.length;
      const textBeforeCursor = text.substring(0, cursorPos);
      const lastBracketIndex = textBeforeCursor.lastIndexOf("[[");
      
      if (lastBracketIndex !== -1) {
        // Replace [[query with [[Ref: Resource_ID]]
        const textAfterBracket = textBeforeCursor.substring(lastBracketIndex + 2);
        const newText = 
          text.substring(0, lastBracketIndex) +
          `[[Ref: ${result.result_id}]]` +
          text.substring(cursorPos);
        
        // Update textarea value
        textarea.value = newText;
        
        // Trigger onChange event for React state
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        nativeInputValueSetter?.call(textarea, newText);
        
        const event = new Event("input", { bubbles: true });
        textarea.dispatchEvent(event);
        
        // Also call onContentChange if provided
        if (onContentChange) {
          onContentChange(newText);
        }
        
        // Set cursor after the inserted citation
        const newCursorPos = lastBracketIndex + `[[Ref: ${result.result_id}]]`.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        
        // Focus back to textarea
        textarea.focus();
      }
      
      onSelect(result.result_id, result.title);
      setIsOpen(false);
      setQuery("");
    }, 0);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen || !query.trim()) {
    return null;
  }

  const textarea = textareaRef.current;
  if (!textarea) return null;

  // Calculate position relative to textarea
  const textareaRect = textarea.getBoundingClientRect();
  const scrollTop = textarea.scrollTop;
  const text = textarea.value;
  const cursorPos = textarea.selectionStart || 0;
  const textBeforeCursor = text.substring(0, cursorPos);
  const lastBracketIndex = textBeforeCursor.lastIndexOf("[[");
  
  // Calculate approximate position
  const lines = text.substring(0, lastBracketIndex).split("\n");
  const lineHeight = 20;
  const lineNumber = lines.length - 1;
  const topOffset = lineNumber * lineHeight - scrollTop;

  return (
    <div
      ref={searchRef}
      className="absolute z-50 w-96 border border-sme-gold bg-forest-obsidian shadow-lg"
      style={{
        top: `${textareaRect.top + topOffset + 25}px`,
        left: `${textareaRect.left}px`,
      }}
    >
      {/* Search Header */}
      <div className="border-b border-sme-gold/30 bg-forest-obsidian px-3 py-2">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-bone-white/70" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SME Citations..."
            className="flex-1 bg-transparent text-sm text-bone-white placeholder-bone-white/50 focus:outline-none font-mono"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            className="text-bone-white/50 hover:text-bone-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Results List */}
      <div
        ref={resultsRef}
        className="max-h-64 overflow-y-auto"
      >
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="text-xs text-bone-white/70 font-mono">Searching...</div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-bone-white/70 font-mono">No evidence found</p>
          </div>
        ) : (
          <div className="py-1">
            {results.map((result, index) => (
              <button
                key={`${result.result_id}-${index}`}
                type="button"
                onClick={() => handleSelectResult(result)}
                className={`w-full px-3 py-2 text-left transition-colors border-b border-sme-gold/10 last:border-b-0 ${
                  index === selectedIndex
                    ? "bg-sme-gold/20 text-bone-white"
                    : "hover:bg-forest-obsidian/80 text-bone-white/90"
                }`}
              >
                <div className="flex items-start gap-2">
                  <BookOpen size={12} className="text-sme-gold/70 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-bone-white truncate">{result.title}</p>
                    {result.content_snippet && (
                      <p className="text-[10px] text-bone-white/60 font-mono truncate mt-0.5">
                        {result.content_snippet}
                      </p>
                    )}
                    <p className="text-[10px] text-bone-white/50 font-mono mt-0.5">
                      {result.result_type}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



