"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CommentForm from "@/components/comments/CommentForm";
import WaterfallComment from "@/components/comments/WaterfallComment";
import { Comment } from "@/types/comment";
import { ChevronRight } from "lucide-react";

interface ProductCommentsProps {
  productId: string;
  productSlug: string;
  initialComments: Comment[];
}

export default function ProductComments({
  productId,
  productSlug,
  initialComments,
}: ProductCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [anchorCommentId, setAnchorCommentId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"newest" | "reputation">("newest");

  // Sync state with props
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Sort comments based on mode
  const sortComments = (comments: Comment[]): Comment[] => {
    const sorted = [...comments];

    if (sortMode === "reputation") {
      sorted.sort((a, b) => {
        const aIsTrusted = a.profiles?.badge_type === "Trusted Voice" ? 1 : 0;
        const bIsTrusted = b.profiles?.badge_type === "Trusted Voice" ? 1 : 0;
        if (aIsTrusted !== bIsTrusted) {
          return bIsTrusted - aIsTrusted;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      // ASCENDING ORDER (Oldest First) - Twitter-style chronology
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    // Recursively sort children
    sorted.forEach((comment) => {
      if (comment.children && comment.children.length > 0) {
        comment.children = sortComments(comment.children);
      }
    });

    return sorted;
  };

  // Build tree helper
  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Clone to avoid mutating state directly
    flatComments.forEach((c) => {
      commentMap.set(c.id, { ...c, children: [] });
    });

    flatComments.forEach((c) => {
      const node = commentMap.get(c.id)!;
      if (c.parent_id && commentMap.has(c.parent_id)) {
        const parent = commentMap.get(c.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        rootComments.push(node);
      }
    });

    return sortComments(rootComments);
  };

  // Determine what to show
  let visibleComments: Comment[] = [];
  let anchorComment: Comment | undefined;

  if (anchorCommentId) {
    // Focused View
    // Find the anchor in the FLAT list to ensure we have it
    const foundAnchor = comments.find((c) => c.id === anchorCommentId);
    if (foundAnchor) {
      anchorComment = { ...foundAnchor };
      // Find direct children of this anchor
      const directChildren = comments.filter((c) => c.parent_id === anchorCommentId);
      // We don't need to build a full tree for children, just their direct nodes
      // deeper nesting is handled by clicking them to drill down
      visibleComments = directChildren.map(c => ({ ...c, children: [] }));
    } else {
      // Fallback if anchor not found
      visibleComments = buildCommentTree(comments);
    }
  } else {
    // Default Root View
    visibleComments = buildCommentTree(comments);
  }

  return (
    <div className="mt-16 space-y-6 border-t border-translucent-emerald pt-12">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl font-semibold text-bone-white">Comments</h2>

        {/* Sort Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-bone-white/70 font-mono uppercase tracking-wider">
            Sort:
          </span>
          <button
            type="button"
            onClick={() => setSortMode(sortMode === "newest" ? "reputation" : "newest")}
            className="text-xs font-mono uppercase tracking-wider px-2 py-1 border border-translucent-emerald bg-forest-obsidian text-bone-white/70 hover:text-bone-white hover:border-heart-green transition-colors active:scale-95"
          >
            {sortMode === "newest" ? "Newest" : "Trusted Voice"}
          </button>
        </div>
      </div>

      {/* Root Comment Form - Only show if NO anchor or we want it always at top? 
          Usually always at top for "New Topic", but if drilled down, maybe hide?
          Let's keep it visible at top for adding NEW root threads. 
      */}
      {!anchorCommentId && (
        <div className="mb-8">
          <CommentForm
            type="product"
            productId={productId}
            productSlug={productSlug}
            onSuccess={() => router.refresh()}
          />
        </div>
      )}

      {/* Waterfall Navigation Header */}
      {anchorCommentId && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => {
              const current = comments.find((c) => c.id === anchorCommentId);
              if (current?.parent_id) {
                setAnchorCommentId(current.parent_id);
              } else {
                setAnchorCommentId(null);
              }
            }}
            className="flex items-center gap-1 text-sm text-bone-white/60 hover:text-sme-gold transition-colors font-mono"
          >
            Start of Thread
          </button>
          <span className="text-bone-white/20">/</span>
          <span className="text-xs text-bone-white/40 font-mono">Viewing Thread</span>
        </div>
      )}

      {/* Comments Container */}
      <div className="space-y-4 transition-all duration-300">
        {(() => {
          if (comments.length === 0) {
            return (
              <p className="text-center text-bone-white font-mono opacity-60 py-8">
                Signal Pending: Be the first auditor to share your intuition.
              </p>
            );
          }

          if (anchorCommentId && !anchorComment) {
            // Anchor was deleted or not found, show roots
            return buildCommentTree(comments).map(comment => (
              <WaterfallComment
                key={comment.id}
                comment={comment}
                isAnchor={false}
                onFocus={setAnchorCommentId}
                depth={0}
                type="product"
              />
            ));
          }

          return (
            <>
              {/* Anchor Post */}
              {anchorComment && (
                <div className="mb-6 border-l-2 border-sme-gold pl-4 relative">
                  {/* Vertical Thread Line */}
                  <div className="absolute left-[-1px] top-0 bottom-[-24px] w-[2px] bg-gradient-to-b from-sme-gold to-transparent" />

                  <WaterfallComment
                    comment={anchorComment}
                    isAnchor={true}
                    onFocus={setAnchorCommentId}
                    depth={0} // Visual depth reset for anchor view
                    type="product"
                  />

                  {/* Reply Form for Anchor (Authenticated Users Only logic inside CommentForm handles auth check) */}
                  <div className="mt-4 ml-6">
                    <CommentForm
                      type="product"
                      productId={productId}
                      productSlug={productSlug}
                      parentId={anchorComment.id}
                      onSuccess={() => router.refresh()}
                      className="bg-forest-obsidian/50 border-white/5"
                    />
                  </div>
                </div>
              )}

              {/* Children List */}
              <div className={anchorComment ? "pl-6" : ""}>
                {visibleComments.map((comment) => (
                  <WaterfallComment
                    key={comment.id}
                    comment={comment}
                    isAnchor={false}
                    onFocus={setAnchorCommentId}
                    depth={anchorComment ? 1 : 0}
                    type="product"
                  />
                ))}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
