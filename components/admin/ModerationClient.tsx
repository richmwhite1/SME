"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { restoreFromQueue, purgeFromQueue } from "@/app/actions/admin-actions";
import { useToast } from "@/components/ui/ToastContainer";
import { RotateCcw, Trash2, User, Clock, Flag, FileText, MessageSquare, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Button from "@/components/ui/Button";
import DisputeButton from "./DisputeButton";

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

interface ModerationClientProps {
  queueItems: QueueItem[];
  restoreAction: typeof restoreFromQueue;
  purgeAction: typeof purgeFromQueue;
}

type SubTab = "discussion" | "product";

export default function ModerationClient({
  queueItems,
  restoreAction,
  purgeAction,
}: ModerationClientProps) {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const [restoring, setRestoring] = useState<Record<string, boolean>>({});
  const [purging, setPurging] = useState<Record<string, boolean>>({});
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("discussion");
  const [showReasonPrompt, setShowReasonPrompt] = useState<{ type: "restore" | "purge"; itemId: string } | null>(null);
  const [reason, setReason] = useState("");

  // Filter items by comment_type
  const discussionItems = queueItems.filter((item) => item.comment_type === "discussion");
  const productItems = queueItems.filter((item) => item.comment_type === "product");

  const handleRestore = async (queueItemId: string, reason?: string) => {
    setRestoring((prev) => ({ ...prev, [queueItemId]: true }));

    try {
      await restoreAction(queueItemId, reason);
      showToast("Comment restored to public list", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to restore comment", "error");
    } finally {
      setRestoring((prev) => ({ ...prev, [queueItemId]: false }));
      setShowReasonPrompt(null);
      setReason("");
    }
  };

  const handlePurge = async (queueItemId: string, reason?: string) => {
    setPurging((prev) => ({ ...prev, [queueItemId]: true }));

    try {
      await purgeAction(queueItemId, reason);
      showToast("Comment purged from archive", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to purge comment", "error");
    } finally {
      setPurging((prev) => ({ ...prev, [queueItemId]: false }));
      setShowReasonPrompt(null);
      setReason("");
    }
  };

  const promptForReason = (type: "restore" | "purge", itemId: string) => {
    if (type === "purge") {
      if (
        !confirm(
          "PURGE CONFIRMATION: This will permanently delete this comment from the archive. This action cannot be undone. Continue?"
        )
      ) {
        return;
      }
    }
    setShowReasonPrompt({ type, itemId });
  };

  const confirmAction = () => {
    if (!showReasonPrompt) return;
    if (showReasonPrompt.type === "restore") {
      handleRestore(showReasonPrompt.itemId, reason || undefined);
    } else {
      handlePurge(showReasonPrompt.itemId, reason || undefined);
    }
  };

  const renderItem = (item: QueueItem) => {
    const isRestoring = restoring[item.id];
    const isPurging = purging[item.id];
    const isGuest = !item.author_id && item.guest_name;
    const author = item.profiles;
    const discussion = item.discussions;
    const product = item.protocols;
    const isNested = item.parent_id !== null;
    // Binary indentation firewall: 0px for root, 20px for nested
    const marginLeft = isNested ? "20px" : "0px";

    return (
      <div
        key={item.id}
        className="border border-bone-white/20 bg-bone-white/5 p-4 sm:p-6 font-mono"
        style={{ marginLeft }}
      >
        {/* Header Row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-2">
            {/* Author Info */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {isGuest ? (
                <>
                  <User className="h-4 w-4 text-bone-white/70" />
                  <span className="font-semibold text-bone-white">{item.guest_name}</span>
                  <span className="border border-bone-white/30 bg-bone-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-bone-white/70">
                    GUEST
                  </span>
                </>
              ) : author ? (
                <>
                  <User className="h-4 w-4 text-bone-white/70" />
                  <span className="font-semibold text-bone-white">
                    {author.full_name || "Anonymous"}
                  </span>
                  {author.username && (
                    <span className="text-xs text-bone-white/50">@{author.username}</span>
                  )}
                  {item.author_id && (
                    <span className="text-[10px] text-bone-white/40 font-mono">
                      ID: {item.author_id.slice(0, 8)}...
                    </span>
                  )}
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-bone-white/70" />
                  <span className="text-bone-white/70">Anonymous</span>
                  {item.author_id && (
                    <span className="text-[10px] text-bone-white/40 font-mono">
                      ID: {item.author_id.slice(0, 8)}...
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Discussion/Product Link */}
            {discussion && (
              <div className="flex items-center gap-2 text-xs">
                <FileText className="h-3 w-3 text-bone-white/70" />
                <a
                  href={`/discussions/${discussion.slug || item.discussion_id}`}
                  className="text-bone-white/70 hover:text-bone-white transition-colors underline"
                >
                  {discussion.title || "Discussion"}
                </a>
              </div>
            )}
            {product && (
              <div className="flex items-center gap-2 text-xs">
                <FileText className="h-3 w-3 text-bone-white/70" />
                <a
                  href={`/products/${product.slug || item.protocol_id}`}
                  className="text-bone-white/70 hover:text-bone-white transition-colors underline"
                >
                  {product.title || "Product"}
                </a>
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-bone-white/50">
              <div className="flex items-center gap-1">
                <Flag className="h-3 w-3" />
                <span className="font-semibold text-bone-white/70">
                  {item.flag_count} reporter{item.flag_count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Queued {formatDistanceToNow(new Date(item.queued_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Created {formatDistanceToNow(new Date(item.original_created_at), { addSuffix: true })}
                </span>
              </div>
              {item.status === "disputed" && (
                <div className="flex items-center gap-1">
                  <span className="border border-yellow-500/50 bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-400">
                    DISPUTED
                  </span>
                </div>
              )}
            </div>

            {/* Dispute Button (only for comment author) */}
            {user && item.author_id && (
              <div className="mt-2">
                <DisputeButton
                  queueItemId={item.id}
                  authorId={item.author_id}
                  currentUserId={user.id}
                  status={item.status}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {showReasonPrompt?.itemId === item.id && showReasonPrompt.type === "restore" ? (
              <div className="border border-emerald-400/30 bg-emerald-400/5 p-3 rounded font-mono">
                <p className="text-xs text-bone-white/70 mb-2 uppercase tracking-wider">
                  Reason (Optional)
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you restoring this comment?"
                  className="w-full bg-forest-obsidian border border-bone-white/20 text-bone-white p-2 rounded text-sm mb-2 font-mono"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={confirmAction}
                    disabled={isRestoring}
                    className="flex items-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-3 py-1.5 transition-colors"
                  >
                    Confirm Restore
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReasonPrompt(null);
                      setReason("");
                    }}
                    className="flex items-center gap-2 border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10 text-xs font-mono px-3 py-1.5 transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : showReasonPrompt?.itemId === item.id && showReasonPrompt.type === "purge" ? (
              <div className="border border-rose-500/30 bg-rose-500/5 p-3 rounded font-mono">
                <p className="text-xs text-bone-white/70 mb-2 uppercase tracking-wider">
                  Reason (Optional)
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you purging this comment?"
                  className="w-full bg-forest-obsidian border border-bone-white/20 text-bone-white p-2 rounded text-sm mb-2 font-mono"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={confirmAction}
                    disabled={isPurging}
                    className="flex items-center gap-2 border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-mono px-3 py-1.5 transition-colors"
                  >
                    Confirm Purge
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReasonPrompt(null);
                      setReason("");
                    }}
                    className="flex items-center gap-2 border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10 text-xs font-mono px-3 py-1.5 transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => promptForReason("restore", item.id)}
                  disabled={isRestoring || isPurging || !!showReasonPrompt}
                  className="flex items-center justify-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {isRestoring ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>RESTORING...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3 w-3" />
                      <span>RESTORE</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => promptForReason("purge", item.id)}
                  disabled={isRestoring || isPurging || !!showReasonPrompt}
                  className="flex items-center justify-center gap-2 border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-mono px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {isPurging ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>PURGING...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3" />
                      <span>PURGE</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="border-t border-bone-white/10 pt-4">
          <div className="rounded border border-bone-white/10 bg-forest-obsidian p-4">
            <p className="text-sm text-bone-white/90 leading-relaxed whitespace-pre-wrap font-mono">
              {item.content}
            </p>
          </div>
          {item.dispute_reason && (
            <div className="mt-3 border border-yellow-500/30 bg-yellow-500/5 p-3 rounded">
              <p className="text-xs text-yellow-400/70 uppercase tracking-wider mb-1 font-mono">
                Dispute Reason:
              </p>
              <p className="text-sm text-bone-white/80 font-mono">{item.dispute_reason}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (queueItems.length === 0) {
    return null; // Empty state handled in parent
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="border-b border-bone-white/20">
        <nav className="flex space-x-1" aria-label="Sub-tabs">
          <button
            onClick={() => setActiveSubTab("discussion")}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider
              border-b-2 transition-colors
              ${
                activeSubTab === "discussion"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-bone-white/70 hover:text-bone-white hover:border-bone-white/30"
              }
            `}
          >
            <MessageSquare className="h-4 w-4" />
            Discussion Signals ({discussionItems.length})
          </button>
          <button
            onClick={() => setActiveSubTab("product")}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider
              border-b-2 transition-colors
              ${
                activeSubTab === "product"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-bone-white/70 hover:text-bone-white hover:border-bone-white/30"
              }
            `}
          >
            <Package className="h-4 w-4" />
            Product Feedback ({productItems.length})
          </button>
        </nav>
      </div>

      {/* Sub-tab Content */}
      <div className="space-y-4">
        {activeSubTab === "discussion" && (
          <>
            {discussionItems.length === 0 ? (
              <div className="border border-bone-white/20 bg-bone-white/5 p-12 text-center">
                <MessageSquare className="h-12 w-12 text-bone-white/30 mx-auto mb-4" />
                <p className="font-mono text-lg text-bone-white/70 mb-2">NO DISCUSSION SIGNALS</p>
                <p className="font-mono text-sm text-bone-white/50">
                  No flagged discussion comments in queue
                </p>
              </div>
            ) : (
              discussionItems.map(renderItem)
            )}
          </>
        )}

        {activeSubTab === "product" && (
          <>
            {productItems.length === 0 ? (
              <div className="border border-bone-white/20 bg-bone-white/5 p-12 text-center">
                <Package className="h-12 w-12 text-bone-white/30 mx-auto mb-4" />
                <p className="font-mono text-lg text-bone-white/70 mb-2">NO PRODUCT FEEDBACK</p>
                <p className="font-mono text-sm text-bone-white/50">
                  No flagged product comments in queue
                </p>
              </div>
            ) : (
              productItems.map(renderItem)
            )}
          </>
        )}
      </div>
    </div>
  );
}

