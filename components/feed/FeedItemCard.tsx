"use client";

import { useRouter } from "next/navigation";
import { MessageSquare, BookOpen, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import TopicBadge from "@/components/topics/TopicBadge";

interface FollowedSignalItem {
  id: string;
  type: "product" | "discussion" | "evidence";
  title: string;
  content: string;
  created_at: string;
  author_id?: string | null;
  author_name: string | null;
  author_username: string | null;
  slug: string | null;
  tags: string[] | null;
  is_sme_certified?: boolean;
}

export default function FeedItemCard({ item }: { item: FollowedSignalItem }) {
  const router = useRouter();

  const handleCardClick = () => {
    const href = getHref();
    if (href && href !== "#") {
      router.push(href);
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case "product":
        return <BookOpen size={14} className="text-heart-green" />;
      case "discussion":
        return <MessageSquare size={14} className="text-third-eye-indigo" />;
      case "evidence":
        return <BookOpen size={14} className="text-bone-white/70" />;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case "product":
        return "Product";
      case "discussion":
        return "Discussion";
      case "evidence":
        return "Evidence";
    }
  };

  const getHref = () => {
    switch (item.type) {
      case "product":
        return `/products/${item.slug}`;
      case "discussion":
        // Use id if available, fallback to slug for backward compatibility
        return `/discussions/${item.id || item.slug}`;
      case "evidence":
        return "/resources";
      default:
        return "#";
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="cursor-pointer select-none block border border-translucent-emerald bg-forest-obsidian p-4 transition-all duration-300 hover:border-heart-green active:scale-95"
      style={{ userSelect: 'none' }}
    >
      <div className="mb-2 flex items-center gap-2">
        {getTypeIcon()}
        <span className="text-[10px] text-bone-white/70 font-mono uppercase tracking-wider">
          {getTypeLabel()}
        </span>
        {item.is_sme_certified && (
          <span className="flex items-center gap-1 border border-sme-gold/30 bg-sme-gold/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-sme-gold">
            <Award size={8} />
            Certified
          </span>
        )}
        <span className="text-[10px] text-bone-white/50 font-mono">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </span>
      </div>
      <h3 className="mb-2 font-serif text-base font-semibold text-bone-white line-clamp-2">
        {item.title}
      </h3>
      <p className="mb-2 text-sm text-bone-white/80 font-mono leading-relaxed line-clamp-2">
        {item.content}
      </p>
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {item.tags.slice(0, 3).map((tag) => (
            <TopicBadge key={tag} topic={tag} clickable={true} />
          ))}
        </div>
      )}
      {item.author_name && (
        <div className="mt-2 text-xs text-bone-white/50 font-mono" onClick={(e) => e.stopPropagation()}>
          by{" "}
          {item.author_username ? (
            <span
              onClick={() => router.push(`/u/${item.author_username}`)}
              className="hover:text-bone-white transition-colors cursor-pointer"
            >
              {item.author_name}
            </span>
          ) : item.author_id ? (
            <span
              onClick={() => router.push(`/profile/${item.author_id}`)}
              className="hover:text-bone-white transition-colors cursor-pointer"
            >
              {item.author_name}
            </span>
          ) : (
            item.author_name
          )}
          {item.author_username && (
            <span
              onClick={() => router.push(`/u/${item.author_username}`)}
              className="ml-1 hover:text-bone-white transition-colors cursor-pointer"
            >
              @{item.author_username}
            </span>
          )}
        </div>
      )}
    </div>
  );
}



