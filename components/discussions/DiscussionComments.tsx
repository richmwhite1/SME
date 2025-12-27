"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { flagComment, createDiscussionComment, getDiscussionComments } from "@/app/actions/discussion-actions";
import CommentForm from "@/components/comments/CommentForm";
import CitationText from "@/components/comments/CitationText";
import CitationSearch from "@/components/comments/CitationSearch";
import CitationInput from "@/components/comments/CitationInput";
import AcceptSolutionButton from "@/components/discussions/AcceptSolutionButton";
import Button from "@/components/ui/Button";
import { Send, Loader2, Reply, BookOpen, ExternalLink, Award, CheckCircle2, Link2, Check, Image, UserCircle, Flag, Lightbulb, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AvatarLink from "@/components/profile/AvatarLink";
import { useToast } from "@/components/ui/ToastContainer";
import TrustWeight from "@/components/ui/TrustWeight";
import SocialCard from "@/components/social/SocialCard";
import { useShareCard } from "@/components/social/useShareCard";
import UserBadge from "@/components/UserBadge";
import { toggleCommentVote } from "@/app/actions/vote-actions";

interface ResourceReference {
  resource_id: string;
  resource_title: string;
  resource_url: string | null;
}

import WaterfallComment from "@/components/comments/WaterfallComment";
import { Comment } from "@/types/comment";
import OfficialResponseToggle from "@/components/sme/OfficialResponseToggle";

interface DiscussionCommentsProps {
  discussionId: string;
  discussionSlug: string;
  discussionTitle?: string;
  initialComments: Comment[];
  isBounty?: boolean;
  bountyStatus?: string | null;
  solutionCommentId?: string | null;
  isAuthor?: boolean;
}

type SortMode = "newest" | "reputation";

export default function DiscussionComments({
  discussionId,
  discussionSlug,
  discussionTitle,
  initialComments,
  isBounty = false,
  bountyStatus = null,
  solutionCommentId = null,
  isAuthor = false,
}: DiscussionCommentsProps) {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const { showToast } = useToast();
  const { isOpen, shareData, openShareCard, closeShareCard, handleExport } = useShareCard();
  const [references, setReferences] = useState<ResourceReference[]>([]);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [anchorCommentId, setAnchorCommentId] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyReferences, setReplyReferences] = useState<ResourceReference[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfficialResponse, setIsOfficialResponse] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if user is SME
  const isSME = user?.publicMetadata?.is_verified_expert || user?.publicMetadata?.badge_type === 'Trusted Voice';

  // Build threaded comment tree
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map and initialize children
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, children: [], parent: null });
    });

    // Second pass: build tree and set parent references
    comments.forEach((comment) => {
      const commentNode = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(commentNode);
          commentNode.parent = parent; // Set parent reference for Signal Bridge
        } else {
          // Orphaned comment (parent deleted), treat as root
          rootComments.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    // Sort root comments
    return sortComments(rootComments);
  };

  // Sort comments based on mode
  const sortComments = (comments: Comment[]): Comment[] => {
    const sorted = [...comments];

    if (sortMode === "reputation") {
      sorted.sort((a, b) => {
        // Pin official responses to top first
        if (a.is_official_response && !b.is_official_response) return -1;
        if (!a.is_official_response && b.is_official_response) return 1;

        const aIsTrusted = a.profiles?.badge_type === "Trusted Voice" ? 1 : 0;
        const bIsTrusted = b.profiles?.badge_type === "Trusted Voice" ? 1 : 0;
        if (aIsTrusted !== bIsTrusted) {
          return bIsTrusted - aIsTrusted;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      sorted.sort((a, b) => {
        // Pin official responses to top first
        if (a.is_official_response && !b.is_official_response) return -1;
        if (!a.is_official_response && b.is_official_response) return 1;

        // ASCENDING ORDER (Oldest First) - Fix Chronology
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }

    // Recursively sort children
    sorted.forEach((comment) => {
      if (comment.children && comment.children.length > 0) {
        comment.children = sortComments(comment.children);
      }
    });

    return sorted;
  };

  // Fetch comments with references
  const fetchComments = async () => {
    try {
      const commentsData = await getDiscussionComments(discussionId);
      setComments((commentsData || []) as Comment[]);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [discussionId]);

  // Handle scroll to comment when commentId is in URL (query param or hash anchor)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for query parameter first, then hash anchor
    const urlParams = new URLSearchParams(window.location.search);
    let commentId = urlParams.get("commentId");

    // Fallback to hash anchor if no query param
    if (!commentId) {
      const hash = window.location.hash;
      const hashMatch = hash.match(/^#(.+)$/);
      commentId = hashMatch ? hashMatch[1] : null;
    }

    if (commentId) {
      // Small delay to ensure comments are rendered
      setTimeout(() => {
        // Try multiple ID formats for compatibility
        const commentElement = document.getElementById(commentId) ||
          document.getElementById(`comment-${commentId}`) ||
          document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
          commentElement.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
          // Highlight the comment briefly with Emerald Aura
          commentElement.classList.add("highlight-signal");
          setTimeout(() => {
            commentElement.classList.remove("highlight-signal");
          }, 2000);
        }
      }, 300);
    }
  }, [comments, discussionId]);



  // Handle reply submission (replies are handled separately from main form)
  const handleSubmit = async (e: React.FormEvent, parentId?: string | null) => {
    e.preventDefault();
    if (!replyContent.trim() || loading) return;

    // Replies require authentication (discussions only allow SME comments)
    if (!isSignedIn) {
      showToast("You must be logged in to reply", "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createDiscussionComment(
        discussionId,
        replyContent.trim(),
        discussionSlug,
        parentId || undefined,
        replyReferences,
        isOfficialResponse
      );

      setReplyContent("");
      setReplyReferences([]);
      const wasOfficial = isOfficialResponse;
      setIsOfficialResponse(false);


      // Refresh to get real comment from server
      await fetchComments();
      router.refresh();

      // Show success toast with specific message
      if (wasOfficial) {
        showToast("Official SME response posted! Community members will be notified.", "success");
      } else {
        showToast("Reply posted successfully", "success");
      }

      // Keep viewing the same anchor if exists, logic handles it as long as comment still exists
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to post reply";
      setError(errorMessage);

      // Revert optimistic update on error by refetching from server
      await fetchComments();

      // Show toast notification
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const threadedComments = buildCommentTree(comments);

  return (
    <div className="space-y-6">
      {/* Sort Toggle */}
      <div className="flex items-center justify-end">
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

      {/* Main Comment Form */}
      <CommentForm
        type="discussion"
        discussionId={discussionId}
        discussionSlug={discussionSlug}
        references={references}
        onReferenceChange={setReferences}
        onSuccess={async () => {
          // Refresh comments after successful submission
          await new Promise(resolve => setTimeout(resolve, 200));
          await fetchComments();
          router.refresh();
        }}
      />

      {/* Waterfall Navigation Header */}
      {anchorCommentId && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => {
              const current = comments.find(c => c.id === anchorCommentId);
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

      {/* Comments Tree */}
      <div className="space-y-4">
        {(() => {
          // Logic to determine what to show
          let visibleComments: Comment[] = [];
          let anchorComment: Comment | undefined;

          if (anchorCommentId) {
            // Try to find in flattened list first to get the node
            anchorComment = comments.find(c => c.id === anchorCommentId);
            // But we need the node with children populated from buildCommentTree
            // The 'threadedComments' is the root list. We need to search the tree.

            // Helper to find node in tree
            const findInTree = (nodes: Comment[], id: string): Comment | undefined => {
              for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                  const found = findInTree(node.children, id);
                  if (found) return found;
                }
              }
              return undefined;
            };

            // Re-build tree to ensure all links are fresh
            const fullTree = buildCommentTree(comments);
            const found = findInTree(fullTree, anchorCommentId);

            if (found) {
              anchorComment = found;
              visibleComments = found.children || [];
            } else {
              // Fallback if not found (shouldn't happen)
              visibleComments = [];
            }
          } else {
            visibleComments = buildCommentTree(comments);
          }

          if (comments.length === 0) {
            return (
              <p className="text-center text-bone-white/70 text-sm font-mono">
                Signal Pending: Be the first auditor to share your intuition.
              </p>
            );
          }

          return (
            <>
              {/* Render Anchor if exists */}
              {anchorComment && (
                <div className="mb-6 border-b border-white/10 pb-6">
                  <WaterfallComment
                    comment={anchorComment}
                    isAnchor={true}
                    onFocus={setAnchorCommentId}
                    type="discussion"
                    onReactionUpdate={fetchComments}
                  />
                  {/* Inline Reply Form for Anchor */}
                  <div className="ml-1 pl-4 border-l border-sme-gold/20 mt-4">
                    <h4 className="text-xs font-mono text-sme-gold mb-2">Reply to this thread</h4>
                    <form onSubmit={(e) => handleSubmit(e, anchorComment!.id)} className="space-y-2">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Add your expert commentary..."
                        className="w-full bg-forest-obsidian border border-translucent-emerald p-2 text-sm text-bone-white rounded focus:border-sme-gold outline-none font-mono"
                        rows={3}
                      />
                      <OfficialResponseToggle
                        value={isOfficialResponse}
                        onChange={setIsOfficialResponse}
                        isSME={isSME || false}
                      />
                      <div className="flex justify-end">
                        <Button variant="primary" className="text-xs px-3 py-1.5 h-auto" type="submit" disabled={loading}>
                          {loading ? <Loader2 className="animate-spin" size={14} /> : "Post Reply"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Render List (Children or Roots) */}
              <div className={anchorComment ? "" : ""}>
                {visibleComments.map(comment => (
                  <WaterfallComment
                    key={comment.id}
                    comment={comment}
                    isAnchor={false}
                    onFocus={setAnchorCommentId}
                    depth={anchorComment ? 1 : 0}
                    type="discussion"
                    onReactionUpdate={fetchComments} // Refresh to get updated reaction counts
                  />
                ))}
              </div>
            </>
          );

        })()}
      </div>

      {/* Share Card Modal */}
      {isOpen && shareData && (
        <SocialCard
          type={shareData.type}
          content={shareData.content}
          authorName={shareData.authorName}
          authorUsername={shareData.authorUsername}
          trustWeight={shareData.trustWeight}
          contributorScore={shareData.contributorScore}
          discussionTitle={shareData.discussionTitle}
          onClose={closeShareCard}
          onExport={handleExport}
        />
      )}
    </div>
  );
}

