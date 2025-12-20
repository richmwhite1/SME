"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { flagComment, createDiscussionComment } from "@/app/actions/discussion-actions";
import CommentForm from "@/components/comments/CommentForm";
import CitationText from "@/components/comments/CitationText";
import CitationSearch from "@/components/comments/CitationSearch";
import CitationInput from "@/components/comments/CitationInput";
import AcceptSolutionButton from "@/components/discussions/AcceptSolutionButton";
import Button from "@/components/ui/Button";
import { Send, Loader2, Reply, BookOpen, ExternalLink, Award, CheckCircle2, Link2, Check, Image, UserCircle, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import AvatarLink from "@/components/profile/AvatarLink";
import { useToast } from "@/components/ui/ToastContainer";
import TrustWeight from "@/components/ui/TrustWeight";
import SocialCard from "@/components/social/SocialCard";
import { useShareCard } from "@/components/social/useShareCard";
import UserBadge from "@/components/UserBadge";

interface ResourceReference {
  resource_id: string;
  resource_title: string;
  resource_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  guest_name?: string | null;
  is_flagged: boolean;
  profiles: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    badge_type: string | null;
    contributor_score: number | null;
  } | null;
  references?: ResourceReference[];
  children?: Comment[];
  parent?: Comment | null; // Reference to parent comment for Signal Bridge
}

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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyReferences, setReplyReferences] = useState<ResourceReference[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

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
        const aIsTrusted = a.profiles?.badge_type === "Trusted Voice" ? 1 : 0;
        const bIsTrusted = b.profiles?.badge_type === "Trusted Voice" ? 1 : 0;
        if (aIsTrusted !== bIsTrusted) {
          return bIsTrusted - aIsTrusted;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
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
    const supabase = createClient();
    const { data: commentsData, error: commentsError } = await supabase
      .from("discussion_comments")
      .select(`
        id,
        content,
        created_at,
        parent_id,
        profiles!discussion_comments_author_id_fkey(
          id,
          full_name,
          username,
          avatar_url,
          badge_type,
          contributor_score
        )
      `)
      .eq("discussion_id", discussionId)
      .or("is_flagged.eq.false,is_flagged.is.null")
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return;
    }

    // Schema Cleanup: comment_references table query disabled until table is confirmed to exist
    // TODO: Re-enable when comment_references table is created in database
    // const commentsWithReferences = await Promise.all(
    //   (commentsData || []).map(async (comment) => {
    //     const { data: refsData } = await supabase
    //       .from("comment_references")
    //       .select("resource_id, resource_title, resource_url")
    //       .eq("comment_id", comment.id);
    //
    //     return {
    //       ...comment,
    //       references: (refsData || []).map((ref) => ({
    //         resource_id: ref.resource_id,
    //         resource_title: ref.resource_title,
    //         resource_url: ref.resource_url,
    //       })),
    //     };
    //   })
    // );

    // Set comments without references until table exists
    setComments((commentsData || []) as Comment[]);
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
        replyReferences
      );

      setReplyContent("");
      setReplyReferences([]);
      setReplyingTo(null);

      // Small delay to ensure database transaction has committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh to get real comment from server
      await fetchComments();
      router.refresh();
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

      {/* Comments Tree */}
      <div className="space-y-4">
        {threadedComments.length === 0 ? (
          <p className="text-center text-bone-white/70 text-sm font-mono">
            Signal Pending: Be the first auditor to share your intuition.
          </p>
        ) : (
          threadedComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              discussionId={discussionId}
              discussionSlug={discussionSlug}
              discussionTitle={discussionTitle}
              depth={0}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              replyReferences={replyReferences}
              setReplyReferences={setReplyReferences}
              onReplySubmit={(e, parentId) => handleSubmit(e, parentId)}
              loading={loading}
              isSignedIn={isSignedIn}
              isBounty={isBounty}
              bountyStatus={bountyStatus}
              solutionCommentId={solutionCommentId}
              isAuthor={isAuthor}
              onGenerateShareCard={openShareCard}
            />
          ))
        )}
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

// Recursive Comment Thread Component
interface CommentThreadProps {
  comment: Comment;
  discussionId: string;
  discussionSlug: string;
  discussionTitle?: string;
  depth: number;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  replyReferences: ResourceReference[];
  setReplyReferences: (refs: ResourceReference[]) => void;
  onReplySubmit: (e: React.FormEvent, parentId: string) => void;
  loading: boolean;
  isSignedIn: boolean;
  isBounty?: boolean;
  bountyStatus?: string | null;
  solutionCommentId?: string | null;
  isAuthor?: boolean;
  onGenerateShareCard?: (data: any) => void;
}

function CommentThread({
  comment,
  discussionId,
  discussionSlug,
  discussionTitle,
  depth,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  replyReferences,
  setReplyReferences,
  onReplySubmit,
  loading,
  isSignedIn,
  isBounty = false,
  bountyStatus = null,
  solutionCommentId = null,
  isAuthor = false,
  onGenerateShareCard,
}: CommentThreadProps) {
  const isReplying = replyingTo === comment.id;
  const maxVisualDepth = 5; // Visual indentation limit (not a data limit)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isSolution = solutionCommentId === comment.id;
  const [copied, setCopied] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [isFlagged, setIsFlagged] = useState(comment.is_flagged ?? false);
  const router = useRouter();
  const { showToast } = useToast();

  // Copy link to specific comment
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Debug: Check if discussionId is undefined
    console.log("Copy Link Debug - discussionId:", discussionId, "comment.id:", comment.id);
    
    if (!discussionId) {
      console.error("Copy Link Error: discussionId is undefined");
      showToast("Failed to copy link: Discussion ID missing", "error");
      return;
    }
    
    // Deep-link format: query param only (no hash anchor)
    const id = discussionId; // Use discussionId as id for URL generation
    const commentUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/discussions/${id}?commentId=${comment.id}`
      : `?commentId=${comment.id}`;
    
    try {
      await navigator.clipboard.writeText(commentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // Show 'Link Copied to Archive' toast
      showToast("Link Copied to Archive", "success");
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast("Failed to copy link", "error");
    }
  };

  // Generate Share Card
  const handleGenerateShareCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onGenerateShareCard) return;

    // Deep-link format: query param only (no hash anchor)
    const id = discussionId; // Use discussionId as id for URL generation
    const commentUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/discussions/${id}?commentId=${comment.id}`
      : `?commentId=${comment.id}`;

    onGenerateShareCard({
      type: "insight",
      content: comment.content,
      authorName: comment.profiles?.full_name || "Anonymous",
      authorUsername: comment.profiles?.username,
      trustWeight: comment.profiles?.contributor_score || null,
      contributorScore: comment.profiles?.contributor_score || null,
      discussionTitle: discussionTitle || "Community Discussion",
      url: commentUrl,
    });
  };

  // Flag comment handler
  const handleFlag = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      showToast("Please sign in to flag comments", "error");
      return;
    }

    setFlagging(true);

    try {
      const result = await flagComment(comment.id, discussionSlug);
      
      if (result.success) {
        showToast("Signal reported. Thank you for maintaining laboratory quality.", "success");
        
        // If comment was hidden (3+ flags), refresh the page to remove it
        if (result.isHidden) {
          setIsFlagged(true);
          // Refresh after a short delay to show the toast
          setTimeout(() => {
            router.refresh();
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error("Error flagging comment:", error);
      showToast(error.message || "Failed to flag comment", "error");
    } finally {
      setFlagging(false);
    }
  };

  // Hard Firewall: Binary indentation - exactly 20px if depth > 0, 0px otherwise
  // Zero exceptions: Even if depth is 100, margin remains exactly 20px
  // Removed all recursive margin calculations - using exact className logic
  
  // Signal Bridge: Show "Replying to @username" for ANY nested comment (depth > 0)
  // Use parent username if available, otherwise use parent full_name or "user"
  const showSignalBridge = depth > 0 && comment.parent_id !== null;
  const parentUsername = comment.parent?.profiles?.username || comment.parent?.profiles?.full_name || "user";

  // HARD FIREWALL: Binary Indentation - className + inline style backup
  // Rule: depth === 0 ? 'ml-0' : 'ml-5 border-l border-white/10'
  // No reply can ever indent more than 20px (ml-5 = 1.25rem = 20px)
  const isGuest = !comment.profiles && (comment as any).guest_name;
  const marginLeft = depth === 0 ? '0px' : '20px';

  return (
      <div 
      className={depth === 0 ? 'ml-0' : 'ml-5 border-l border-white/10'}
      style={{ scrollMarginTop: '80px', marginLeft }}
      data-comment-id={comment.id}
      id={comment.id}
    >
      {/* Signal Bridge - Replying to @username for nested comments */}
      {showSignalBridge && (
        <span 
          style={{ 
            fontFamily: 'var(--font-geist-mono)', 
            color: '#B8860B',
            fontSize: '0.7rem',
            display: 'block',
            marginBottom: '4px'
          }}
        >
          Replying to @{parentUsername}
        </span>
      )}
      
      {/* Comment Card */}
      <div
        className={`border border-translucent-emerald p-3 transition-all ${
          depth === 0 ? "bg-muted-moss" : "bg-forest-obsidian"
        }`}
      >
        {/* Author Info */}
        <div className="mb-2 flex items-center gap-2">
          {isGuest ? (
            <>
              <UserCircle size={20} className="text-bone-white/40 mr-1" />
              <span className="text-xs font-semibold text-bone-white font-mono">
                {(comment as any).guest_name}
              </span>
              <span className="border border-bone-white/20 bg-bone-white/5 px-1.5 py-0.5 text-[10px] font-medium text-bone-white/50 font-mono uppercase">
                GUEST
              </span>
            </>
          ) : comment.profiles ? (
            <>
              <Link
                href={comment.profiles.username 
                  ? `/u/${comment.profiles.username}` 
                  : `/profile/${comment.profiles.id || ""}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <AvatarLink
                  userId={comment.profiles.id || ""}
                  username={comment.profiles.username}
                  avatarUrl={comment.profiles.avatar_url}
                  fullName={comment.profiles.full_name}
                  size={20}
                  className="mr-1"
                />
                <span className="text-xs font-semibold text-bone-white font-mono hover:text-heart-green transition-colors">
                  {comment.profiles.full_name || "Anonymous"}
                </span>
              </Link>
              <UserBadge profile={comment.profiles} />
              {comment.profiles.username && (
                <Link
                  href={`/u/${comment.profiles.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-bone-white/50 font-mono hover:text-bone-white transition-colors"
                >
                  @{comment.profiles.username}
                </Link>
              )}
            </>
          ) : (
            <span className="text-xs text-bone-white/70 font-mono">Anonymous</span>
          )}
          {comment.profiles?.contributor_score && comment.profiles.contributor_score > 0 && comment.profiles.contributor_score <= 100 && (
            <TrustWeight
              value={comment.profiles.contributor_score}
              verifiedCitations={comment.references?.length || 0}
              className="ml-1"
            />
          )}
          {comment.profiles?.badge_type === "Trusted Voice" && (
            <span className="flex items-center gap-1 border border-sme-gold/30 bg-sme-gold/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-sme-gold">
              <Award size={10} />
              Trusted Voice
            </span>
          )}
          <span className="text-[10px] text-bone-white/50 font-mono">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Solution Badge */}
        {isSolution && (
          <div className="mb-2 flex items-center gap-2 border border-heart-green bg-heart-green/20 px-2 py-1">
            <CheckCircle2 size={14} className="text-heart-green" />
            <span className="text-xs font-mono uppercase tracking-wider text-heart-green">
              Accepted Solution
            </span>
          </div>
        )}

        {/* Comment Content */}
        <div className="mb-2 whitespace-pre-wrap text-sm text-bone-white/90 font-mono leading-relaxed">
          <CitationText content={comment.content} />
        </div>

        {/* References */}
        {comment.references && comment.references.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {comment.references.map((ref) => (
              <div
                key={ref.resource_id}
                className="group flex items-center gap-1 border border-translucent-emerald bg-forest-obsidian px-2 py-0.5 text-[10px] font-mono hover:border-heart-green transition-colors"
              >
                <BookOpen size={8} className="text-bone-white/70" />
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== "undefined") {
                      window.location.href = "/resources";
                    }
                  }}
                  className="text-bone-white/80 hover:text-bone-white transition-colors cursor-pointer"
                >
                  {ref.resource_title}
                </span>
                {ref.resource_url && (
                  <a
                    href={ref.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-bone-white/50 hover:text-bone-white transition-colors"
                  >
                    <ExternalLink size={8} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-2 flex items-center gap-2">
          {/* Accept as Solution Button (only for author, only on bounties, only if not resolved) */}
          {isBounty && isAuthor && bountyStatus !== "resolved" && !isSolution && (
            <AcceptSolutionButton
              discussionId={discussionId}
              commentId={comment.id}
              discussionSlug={discussionSlug}
            />
          )}
          
          {/* Copy Link to Signal Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs text-bone-white/70 hover:text-bone-white font-mono transition-colors active:scale-95"
            title="Copy link to share this insight"
          >
            {copied ? (
              <>
                <Check size={12} className="text-heart-green" />
                <span className="text-heart-green">Copied</span>
              </>
            ) : (
              <>
                <Link2 size={12} />
                <span>Copy Link to Signal</span>
              </>
            )}
          </button>

          {/* Generate Share Card Button */}
          <button
            type="button"
            onClick={handleGenerateShareCard}
            className="flex items-center gap-1 text-xs text-sme-gold hover:text-[#9A7209] font-mono transition-colors active:scale-95"
            title="Generate share card image"
          >
            <Image size={12} />
            <span>Generate Share Card</span>
          </button>
          
          {/* Reply Button - No limit on replies, only visual indentation limit */}
          {isSignedIn && (
            <button
              type="button"
              onClick={() => {
                if (isReplying) {
                  setReplyingTo(null);
                  setReplyContent("");
                  setReplyReferences([]);
                } else {
                  setReplyingTo(comment.id);
                }
              }}
              className="flex items-center gap-1 text-xs text-bone-white/70 hover:text-bone-white font-mono transition-colors active:scale-95"
            >
              <Reply size={12} />
              {isReplying ? "Cancel" : "Reply"}
            </button>
          )}

          {/* Flag Button - Only for signed-in users */}
          {isSignedIn && !isFlagged && (
            <button
              type="button"
              onClick={handleFlag}
              disabled={flagging}
              className="flex items-center gap-1 text-xs text-bone-white/50 hover:text-amber-500 font-mono transition-colors active:scale-95 disabled:opacity-50"
              title="Flag inappropriate content"
            >
              {flagging ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Flag size={12} />
              )}
              <span>Flag</span>
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {isReplying && isSignedIn && (
        <form
          onSubmit={(e) => onReplySubmit(e, comment.id)}
          className={`mt-2 pl-4 space-y-2 border border-translucent-emerald bg-forest-obsidian p-3 ${depth > 0 ? 'ml-5 border-l border-sme-gold/20' : 'ml-0'}`}
        >
          <div className="relative">
            <textarea
              ref={replyTextareaRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply... Use [[ to cite from SME Citations"
              rows={3}
              className="w-full bg-muted-moss border border-translucent-emerald px-2 py-1.5 text-xs text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono resize-none"
              required
              minLength={3}
              maxLength={2000}
            />
            
            {/* Citation Search for Reply */}
            <CitationSearch
              textareaRef={replyTextareaRef}
              onSelect={(resourceId, resourceTitle) => {
                console.log("Citation added to reply:", resourceId, resourceTitle);
              }}
              onContentChange={(newContent) => {
                setReplyContent(newContent);
              }}
            />
          </div>
          
          <CitationInput
            onAddReference={(ref) => {
              if (replyReferences.length < 5) {
                setReplyReferences([...replyReferences, ref]);
              }
            }}
            onRemoveReference={(resourceId) => {
              setReplyReferences((prev) => prev.filter((ref) => ref.resource_id !== resourceId));
            }}
            references={replyReferences}
            maxReferences={5}
          />

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !replyContent.trim()}
              className="flex items-center gap-1 text-xs font-mono px-3 py-1 border border-sme-gold bg-sme-gold text-bone-white hover:bg-[#9A7209] hover:border-[#9A7209] hover:text-bone-white uppercase tracking-wider active:scale-95 transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={12} />
                  Post Reply
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent("");
                setReplyReferences([]);
              }}
              className="text-xs text-bone-white/70 hover:text-bone-white font-mono active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Recursive Children */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.children.map((child) => (
            <CommentThread
              key={child.id}
              comment={child}
              discussionId={discussionId}
              discussionSlug={discussionSlug}
              discussionTitle={discussionTitle}
              depth={1}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              replyReferences={replyReferences}
              setReplyReferences={setReplyReferences}
              onReplySubmit={onReplySubmit}
              loading={loading}
              isSignedIn={isSignedIn}
              isBounty={isBounty}
              bountyStatus={bountyStatus}
              solutionCommentId={solutionCommentId}
              isAuthor={isAuthor}
              onGenerateShareCard={onGenerateShareCard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
