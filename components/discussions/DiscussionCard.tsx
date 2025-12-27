"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import TopicBadge from "@/components/topics/TopicBadge";
import { MessageSquare, Clock, ArrowUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DiscussionCardProps {
  discussion: {
    id: string;
    title: string;
    content: string;
    slug: string;
    created_at: string;
    upvote_count: number;
    tags?: string[] | null;
    message_count?: number;
    last_activity_at?: string;
    top_emojis?: string[] | null;
    profiles?: {
      id: string;
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      badge_type: string | null;
    } | null;
  };
}

export default function DiscussionCard({ discussion }: DiscussionCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    // Validate ID before navigation - Signal Path Validation
    if (!discussion.id) {
      console.error('Signal Lost: Missing ID', discussion);
      return;
    }

    // Validate it's a string
    if (typeof discussion.id !== 'string' || discussion.id.trim() === '') {
      console.error('Signal Lost: Invalid ID format', typeof discussion.id, discussion.id);
      return;
    }

    router.push(`/discussions/${discussion.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="cursor-pointer group select-none block border border-translucent-emerald bg-muted-moss p-4 transition-all duration-300 hover:border-heart-green active:scale-[0.98]"
      style={{
        boxShadow: "0 0 0 rgba(16, 185, 129, 0)",
        transition: "all 0.3s ease-in-out, transform 0.1s ease-out",
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        // Emerald Pulse border on hover
        e.currentTarget.style.boxShadow = "0 0 16px rgba(16, 185, 129, 0.4), 0 0 32px rgba(16, 185, 129, 0.2)";
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 rgba(16, 185, 129, 0)";
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.1)";
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h2 className="mb-2 font-serif text-lg font-semibold text-bone-white">
            {discussion.title}
          </h2>
          <p className="mb-3 line-clamp-2 text-sm text-bone-white/80 leading-relaxed">
            {discussion.content}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Top Row: Author & Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-bone-white/50 font-mono uppercase tracking-wider">
            {discussion.profiles ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  const profileUrl = discussion.profiles?.username
                    ? `/u/${discussion.profiles.username}`
                    : `/profile/${discussion.profiles.id}`;
                  router.push(profileUrl);
                }}
                className="hover:text-bone-white transition-colors cursor-pointer"
              >
                by {discussion.profiles.full_name || "Anonymous"}
                {discussion.profiles.username && (
                  <span className="ml-1">@{discussion.profiles.username}</span>
                )}
              </span>
            ) : (
              <span>by Anonymous</span>
            )}
            <span>
              {new Date(discussion.created_at).toLocaleDateString()}
            </span>
            {discussion.upvote_count > 0 && (
              <span className="text-sme-gold">
                {discussion.upvote_count} upvote{discussion.upvote_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              {discussion.tags.slice(0, 3).map((tag: string) => (
                <TopicBadge key={tag} topic={tag} clickable={true} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Row: Engagement Metrics */}
        <div className="flex items-center gap-4 text-[10px] text-bone-white/60 font-mono border-t border-white/5 pt-2 mt-1">
          {/* Message Count */}
          <div className="flex items-center gap-1.5" title="Comments">
            <MessageSquare size={12} className="text-bone-white/40" />
            <span>{discussion.message_count || 0} comments</span>
          </div>

          {/* Last Activity */}
          {discussion.last_activity_at && (
            <div className="flex items-center gap-1.5" title="Last Activity">
              <Clock size={12} className="text-bone-white/40" />
              <span>active {formatDistanceToNow(new Date(discussion.last_activity_at))} ago</span>
            </div>
          )}

          {/* Top Emojis */}
          {discussion.top_emojis && discussion.top_emojis.length > 0 && (
            <div className="flex items-center gap-1 ml-auto" title="Top Reactions">
              {discussion.top_emojis.map((emoji, i) => (
                <span key={i} className="text-xs bg-white/5 px-1.5 py-0.5 rounded-full">{emoji}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



