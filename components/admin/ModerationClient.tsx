"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  restoreFromQueue,
  purgeFromQueue,
  deleteFlaggedContent,
  clearContentFlag,
  toggleUserBan
} from "@/app/actions/admin-actions";
import { useToast } from "@/components/ui/ToastContainer";
import { RotateCcw, Trash2, User, Clock, Flag, Ban, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Button from "@/components/ui/Button";

interface QueueItem {
  id: string;
  original_comment_id: string;
  comment_type: "discussion" | "product";
  discussion_id: string | null;
  protocol_id: string | null;
  author_id: string | null;
  guest_name: string | null;
  content: string;
  flag_count: number;
  original_created_at: string;
  queued_at: string;
  parent_id: string | null;
  status?: string;
  dispute_reason?: string | null;
  discussions?: {
    title: string;
    slug: string;
  } | null;
  protocols?: {
    title: string;
    slug: string;
  } | null;
  profiles?: {
    full_name: string | null;
    username: string | null;
  } | null;
}

interface FlaggedItem {
  id: string;
  type: "discussion" | "review" | "discussion_comment" | "product_comment";
  content: string; // or title for discussions
  author_id: string | null;
  created_at: string;
  flag_count: number;
  profiles?: {
    full_name: string | null;
    username: string | null;
  } | null;
  // Extra fields for logic
  discussions?: { title: string; slug: string } | null;
  protocols?: { title: string; slug: string } | null;
}

interface ModerationClientProps {
  queueItems: QueueItem[];
  flaggedContent: {
    discussions: any[];
    reviews: any[];
    discussionComments: any[];
    productComments: any[];
  };
  restoreAction: typeof restoreFromQueue;
  purgeAction: typeof purgeFromQueue;
}

export default function ModerationClient({
  queueItems,
  flaggedContent,
  restoreAction,
  purgeAction,
}: ModerationClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  // 1. Flatten Flagged Content into a unified list
  const allFlaggedItems: FlaggedItem[] = [
    ...flaggedContent.discussions.map(d => ({
      id: d.id,
      type: "discussion" as const,
      content: d.title,
      author_id: d.author_id,
      created_at: d.created_at,
      flag_count: d.flag_count,
      profiles: d.profiles,
      discussions: { title: d.title, slug: d.slug }
    })),
    ...flaggedContent.reviews.map(r => ({
      id: r.id,
      type: "review" as const,
      content: r.content,
      author_id: r.user_id,
      created_at: r.created_at,
      flag_count: r.flag_count,
      profiles: r.profiles,
      protocols: r.protocols
    })),
    ...flaggedContent.discussionComments.map(c => ({
      id: c.id,
      type: "discussion_comment" as const,
      content: c.content,
      author_id: c.author_id,
      created_at: c.created_at,
      flag_count: c.flag_count,
      profiles: c.profiles,
      discussions: c.discussions
    })),
    ...flaggedContent.productComments.map(c => ({
      id: c.id,
      type: "product_comment" as const,
      content: c.content,
      author_id: c.author_id,
      created_at: c.created_at,
      flag_count: c.flag_count,
      profiles: c.profiles,
      protocols: c.protocols
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleClearFlag = async (item: FlaggedItem) => {
    if (!confirm("Dismiss these flags and restore content?")) return;
    setProcessing(prev => ({ ...prev, [item.id]: true }));
    try {
      await clearContentFlag(item.id, item.type);
      showToast("Flags cleared. Content restored.", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setProcessing(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleDeleteContent = async (item: FlaggedItem) => {
    if (!confirm("PERMANENTLY DELETE this content? This cannot be undone.")) return;
    setProcessing(prev => ({ ...prev, [item.id]: true }));
    try {
      await deleteFlaggedContent(item.id, item.type);
      showToast("Content deleted.", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setProcessing(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm("Ban this user from the platform? They will lose login and messaging access.")) return;
    // We use a dummy ID for loading state key collision avoidance if needed, but userId is fine here
    setProcessing(prev => ({ ...prev, [`ban-${userId}`]: true }));
    try {
      await toggleUserBan(userId, true, "Banned via Moderation Queue");
      showToast("User banned successfully.", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setProcessing(prev => ({ ...prev, [`ban-${userId}`]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center gap-4 text-sm font-mono text-bone-white/70">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-red-500" />
          <span>Active Flags: {allFlaggedItems.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-bone-white/50" />
          <span>Archived Items: {queueItems.length}</span>
        </div>
      </div>

      {allFlaggedItems.length === 0 ? (
        <div className="border border-bone-white/20 bg-bone-white/5 p-12 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <p className="font-mono text-lg text-bone-white/70 mb-2">ALL CLEAR</p>
          <p className="font-mono text-sm text-bone-white/50">
            No active flags requiring moderation. Good job!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allFlaggedItems.map(item => (
            <div
              key={`${item.type}-${item.id}`}
              className="border border-red-500/20 bg-red-500/5 p-6 font-mono"
            >
              {/* Header: Sender & Meta */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-bone-white/70" />
                    <span className="font-semibold text-bone-white">
                      {item.profiles?.full_name || "Unknown User"}
                    </span>
                    {item.profiles?.username && (
                      <span className="text-xs text-bone-white/50">@{item.profiles?.username}</span>
                    )}
                    <span className="text-xs text-bone-white/30">ID: {item.author_id?.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-bone-white/50">
                    <span className="text-red-400 font-semibold flex items-center gap-1">
                      <Flag className="h-3 w-3" /> {item.flag_count} Flags
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                    <span className="uppercase tracking-wider border border-bone-white/20 px-1.5 py-0.5 rounded text-[10px]">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Power Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleClearFlag(item)}
                    disabled={processing[item.id]}
                    className="flex items-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs px-3 py-1.5"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear Flag
                  </Button>
                  <Button
                    onClick={() => handleDeleteContent(item)}
                    disabled={processing[item.id]}
                    className="flex items-center gap-2 border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs px-3 py-1.5"
                  >
                    <Trash2 className="h-3 w-3" /> Delete Content
                  </Button>
                  {item.author_id && (
                    <Button
                      onClick={() => handleBanUser(item.author_id!)}
                      disabled={processing[`ban-${item.author_id}`]}
                      className="flex items-center gap-2 border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-red-950/50 hover:text-red-400 hover:border-red-500/30 text-xs px-3 py-1.5"
                    >
                      <Ban className="h-3 w-3" /> Ban User
                    </Button>
                  )}
                </div>
              </div>

              {/* Content Payload */}
              <div className="bg-forest-obsidian border border-bone-white/10 p-4 rounded text-sm text-bone-white/90 whitespace-pre-wrap">
                {item.content || "No content text available"}
              </div>

              {/* Context Links */}
              <div className="mt-2 flex gap-4 text-xs">
                {item.discussions && (
                  <a href={`/discussions/${item.discussions.slug}`} className="text-emerald-400 hover:underline">
                    View Discussion: {item.discussions.title}
                  </a>
                )}
                {item.protocols && (
                  <a href={`/products/${item.protocols.slug}`} className="text-emerald-400 hover:underline">
                    View Product: {item.protocols.title}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

