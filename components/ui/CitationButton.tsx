import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface CitationButtonProps {
  url: string;
  label?: string;
}

export default function CitationButton({ url, label = "Source" }: CitationButtonProps) {
  if (!url) return null;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-sm text-deep-stone hover:border-deep-stone/20 transition-colors rounded"
    >
      <span className="font-mono text-xs">{label}</span>
      <ExternalLink size={12} className="text-deep-stone/60" />
    </Link>
  );
}





