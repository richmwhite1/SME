"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import TopicSearch from "./TopicSearch";
import TopicBadge from "./TopicBadge";

interface Discussion {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  upvote_count: number;
  profiles: {
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
                No specific matches for "{searchQuery}" in #{topicName}
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
          {filteredContent.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={
                item.type === "discussion"
                  ? `/discussions/${item.slug}`
                  : `/products/${item.slug}`
              }
              className="block rounded-xl bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-earth-green/20 px-2 py-0.5 text-xs font-medium text-earth-green">
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

              <div className="flex items-center justify-between">
                {item.type === "discussion" && (item as Discussion).profiles && (
                  <div className="flex items-center gap-3">
                    {(item as Discussion).profiles?.avatar_url ? (
                      <Image
                        src={(item as Discussion).profiles!.avatar_url!}
                        alt={(item as Discussion).profiles!.full_name || "User"}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-clay text-xs font-semibold text-deep-stone">
                        {(item as Discussion).profiles?.full_name?.charAt(0).toUpperCase() ||
                          "U"}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-deep-stone">
                          {(item as Discussion).profiles?.full_name || "Anonymous"}
                        </span>
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
                  <div className="flex flex-wrap gap-2">
                    {item.tags
                      .filter((tag) => tag !== topicName)
                      .slice(0, 3)
                      .map((tag) => (
                        <TopicBadge key={tag} topic={tag} clickable={true} />
                      ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
