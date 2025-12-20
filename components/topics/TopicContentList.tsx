"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import TopicSearch from "./TopicSearch";
import TopicBadge from "./TopicBadge";
import AvatarLink from "@/components/profile/AvatarLink";

interface Discussion {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  upvote_count: number;
  is_pinned?: boolean;
  profiles: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    badge_type: string | null;
  } | null;
  tags: string[] | null;
}

interface Product {
  id: string;
  title: string;
  problem_solved: string;
  slug: string;
  created_at: string;
  tags: string[] | null;
}

interface TopicContentListProps {
  allContent: Array<
    | (Discussion & { type: "discussion" })
    | (Product & { type: "product" })
  >;
  topicName: string;
}

export default function TopicContentList({
  allContent,
  topicName,
}: TopicContentListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) {
      return allContent;
    }

    const query = searchQuery.toLowerCase().trim();
    return allContent.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const contentMatch =
        item.type === "discussion"
          ? (item as Discussion).content?.toLowerCase().includes(query) || false
          : (item as Product).problem_solved?.toLowerCase().includes(query) || false;
      return titleMatch || contentMatch;
    });
  }, [allContent, searchQuery]);

  return (
    <>
      <TopicSearch
        topicName={topicName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultCount={filteredContent.length}
      />

      {filteredContent.length === 0 ? (
        <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
          {searchQuery ? (
            <>
              <p className="mb-2 text-lg font-medium text-deep-stone">
                No specific matches for &quot;{searchQuery}&quot; in #{topicName}
              </p>
              <p className="text-deep-stone/70">
                Try a broader search or{" "}
                <Link
                  href="/discussions/new"
                  className="text-earth-green hover:underline"
                >
                  start a new discussion
                </Link>
                !
              </p>
            </>
          ) : (
            <p className="text-deep-stone/70">
              No content found for #{topicName} yet. Be the first to post about it!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredContent.map((item) => {
            const isPinned = item.type === "discussion" && (item as Discussion).is_pinned;
            const handleCardClick = () => {
              const href = item.type === "discussion"
                ? `/discussions/${item.id}`
                : `/products/${item.slug}`;
              router.push(href);
            };
            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={handleCardClick}
                className={`cursor-pointer select-none block rounded-xl p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg active:scale-95 ${
                  isPinned 
                    ? "border-2 border-earth-green/50 bg-earth-green/5" 
                    : "bg-white/50"
                }`}
                style={{ userSelect: 'none' }}
              >
                <div className="mb-3">
                  <div className="mb-2 flex items-center gap-2">
                    {isPinned && (
                      <span className="rounded-full bg-earth-green px-2 py-0.5 text-xs font-medium text-white font-mono uppercase tracking-wider">
                        Pinned
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.type === "discussion" 
                        ? "bg-earth-green/20 text-earth-green" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {item.type === "discussion" ? "Discussion" : "Product"}
                    </span>
                    <span className="text-sm text-deep-stone/60">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                <h2 className="mb-2 text-xl font-semibold text-deep-stone">
                  {item.title}
                </h2>
                {item.type === "discussion" ? (
                  <p className="mb-3 line-clamp-2 text-deep-stone/80">
                    {(item as Discussion).content}
                  </p>
                ) : (
                  <p className="mb-3 line-clamp-2 text-deep-stone/80">
                    {(item as Product).problem_solved}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                {item.type === "discussion" && (item as Discussion).profiles && (
                  <div className="flex items-center gap-3">
                    <AvatarLink
                      userId={(item as Discussion).profiles!.id}
                      username={(item as Discussion).profiles!.username}
                      avatarUrl={(item as Discussion).profiles!.avatar_url}
                      fullName={(item as Discussion).profiles!.full_name}
                      size={32}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={(item as Discussion).profiles!.username ? `/u/${(item as Discussion).profiles!.username}` : `/profile/${(item as Discussion).profiles!.id}`}
                          className="text-sm font-medium text-deep-stone hover:text-earth-green transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(item as Discussion).profiles?.full_name || "Anonymous"}
                        </Link>
                        {(item as Discussion).profiles?.badge_type === "Trusted Voice" && (
                          <span className="rounded-full bg-earth-green/20 px-2 py-0.5 text-xs font-medium text-earth-green">
                            Trusted Voice
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    {item.tags
                      .filter((tag) => tag !== topicName)
                      .slice(0, 3)
                      .map((tag) => (
                        <TopicBadge key={tag} topic={tag} clickable={true} />
                      ))}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </>
  );
}

