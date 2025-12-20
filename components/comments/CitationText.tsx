"use client";

import IntelligencePopover from "./IntelligencePopover";

interface CitationTextProps {
  content: string;
  className?: string;
}

export default function CitationText({ content, className = "" }: CitationTextProps) {
  // Parse text for [[Ref: Resource_ID]] patterns
  const parseCitations = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const citationPattern = /\[\[Ref:\s*([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = citationPattern.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Extract resource ID
      const resourceId = match[1].trim();

      // Add citation with popover
      parts.push(
        <IntelligencePopover key={`citation-${match.index}`} resourceId={resourceId}>
          {match[0]}
        </IntelligencePopover>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  return (
    <span className={className}>
      {parseCitations(content)}
    </span>
  );
}



