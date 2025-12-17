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
      className="inline-flex items-center gap-2 rounded-lg border border-earth-green/30 bg-earth-green/10 px-4 py-2 text-sm font-medium text-earth-green transition-all duration-300 hover:bg-earth-green/20 hover:border-earth-green/50"
    >
      <span>{label}</span>
      <ExternalLink size={14} />
    </Link>
  );
}

