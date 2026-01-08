"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { createProductComment, createGuestProductComment } from "@/app/actions/product-actions";
import { createDiscussionComment, createGuestComment } from "@/app/actions/discussion-actions";
import Button from "@/components/ui/Button";
import CitationSearch from "@/components/comments/CitationSearch";
import CitationInput from "@/components/comments/CitationInput";
import PillarSelector from "@/components/comments/PillarSelector";
import SourcePreviewCard from "@/components/comments/SourcePreviewCard";
import { Send, Loader2, UserCircle } from "lucide-react";
import AvatarLink from "@/components/profile/AvatarLink";
import { useToast } from "@/components/ui/ToastContainer";
import { vibeCheck } from "@/app/actions/vibe-actions";
import EmojiPicker from "@/components/ui/EmojiPicker";
import SourceLinkInput from "@/components/comments/SourceLinkInput";
import PostTypeBadge from "@/components/comments/PostTypeBadge";
import StarRatingInput from "@/components/comments/StarRatingInput";
import { detectUrl } from "@/lib/url-metadata";

interface ResourceReference {
  resource_id: string;
  resource_title: string;
  resource_url: string | null;
}

interface CommentFormProps {
  // Product or Discussion context
  type: "product" | "discussion";

  // Product-specific props
  productId?: string;
  productSlug?: string;

  // Discussion-specific props
  discussionId?: string;
  discussionSlug?: string;
  parentId?: string;
  references?: ResourceReference[];
  onReferenceChange?: (refs: ResourceReference[]) => void;

  // Callbacks
  onSuccess?: () => void;
  onError?: (error: string) => void;

  // Styling
  className?: string;
}

export default function CommentForm({
  type,
  productId,
  productSlug,
  discussionId,
  discussionSlug,
  parentId,
  references = [],
  onReferenceChange,
  onSuccess,
  onError,
  className = "",
}: CommentFormProps) {
  const { isSignedIn, user, isLoaded } = useUser();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Auto-classification state
  const [postType, setPostType] = useState<'verified_insight' | 'community_experience'>('community_experience');
  const [pillarOfTruth, setPillarOfTruth] = useState<string | null>(null);
  const [sourceLink, setSourceLink] = useState("");

  // Star rating state (for products only)
  const [starRating, setStarRating] = useState<number | null>(null);

  // Discussion pages: Guests cannot comment
  const isDiscussion = type === "discussion";
  const canGuestComment = !isDiscussion; // Only products allow guest comments

  // Auto-classify based on citations (discussions) or source link (products)
  useEffect(() => {
    if (type === "discussion") {
      // Discussion classification based on references
      if (references.length > 0) {
        setPostType('verified_insight');
      } else {
        setPostType('community_experience');
        setPillarOfTruth(null);
      }
    } else if (type === "product") {
      // Product classification based on source link
      if (sourceLink.trim()) {
        setPostType('verified_insight');
      } else {
        setPostType('community_experience');
        setPillarOfTruth(null);
      }
    }
  }, [references, sourceLink, type]);

  // Track cursor position in textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCursorPosition(e.target.selectionStart);

    // Auto-detect URL in content for product comments
    if (type === "product" && !sourceLink) {
      const detectedUrl = detectUrl(newContent);
      if (detectedUrl) {
        setSourceLink(detectedUrl);
      }
    }
  };

  const handleTextareaClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  const handleTextareaKeyUp = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Handle emoji selection - insert at cursor position
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = cursorPosition;
    const end = cursorPosition;
    const newContent = content.substring(0, start) + emoji + content.substring(end);

    setContent(newContent);

    // Set cursor position after emoji
    const newCursorPos = start + emoji.length;
    setCursorPosition(newCursorPos);

    // Focus textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || loading) return;

    // For guest users, require guest name
    if (!isSignedIn) {
      if (!canGuestComment) {
        setError("You must be logged in to comment on discussions");
        return;
      }

      if (!guestName.trim() || guestName.trim().length < 2) {
        setError("Please enter a guest name (at least 2 characters)");
        showToast("Please enter a guest name", "error");
        return;
      }
    }

    // Validate pillar requirement for verified insights
    if (postType === 'verified_insight' && !pillarOfTruth) {
      setError("Please select a Pillar of Truth for verified insights");
      showToast("Pillar of Truth is required for evidence-based posts", "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignedIn) {
        // Authenticated user submission
        if (type === "product" && productId && productSlug) {
          console.log('[CommentForm] Submitting authenticated comment...');
          const result = await createProductComment(
            productId,
            content.trim(),
            productSlug,
            parentId,
            undefined, // isOfficialResponse
            sourceLink.trim() || null,
            postType,
            pillarOfTruth,
            starRating // Add star rating
          );

          console.log('[CommentForm] Server response:', result);

          if (!result) {
            throw new Error("Server returned no response");
          }

          if (!result.success) {
            throw new Error(result.error || "Failed to post comment");
          }
        } else if (type === "discussion" && discussionId && discussionSlug) {
          await createDiscussionComment(
            discussionId,
            content.trim(),
            discussionSlug,
            parentId,
            references,
            postType,
            pillarOfTruth
          );
        }
      } else {
        // Guest user submission (products only)
        if (type === "product" && productId && productSlug) {
          // First run vibeCheck for guest product comments
          const vibeResult = await vibeCheck(content.trim());

          if (!vibeResult.approved) {
            throw new Error("Content rejected by laboratory AI.");
          }

          // If approved, proceed with database insert
          // If approved, proceed with database insert
          console.log('[CommentForm] Submitting guest comment...');
          const result = await createGuestProductComment(
            productId,
            content.trim(),
            guestName.trim(),
            productSlug,
            starRating // Add star rating
          );

          console.log('[CommentForm] Guest Server response:', result);

          if (!result) {
            throw new Error("Server returned no response");
          }

          if (!result.success) {
            throw new Error(result.error || "Failed to post comment");
          }
        } else {
          throw new Error("Guest comments are not allowed on discussions");
        }
      }

      // Success
      setContent("");
      setGuestName("");
      setPillarOfTruth(null);
      setStarRating(null); // Reset star rating
      setError(null);

      if (onSuccess) {
        onSuccess();
      }

      showToast("Comment posted successfully", "success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to post comment";
      setError(errorMessage);

      if (errorMessage.includes("rejected by laboratory AI")) {
        showToast("Content rejected by laboratory AI.", "error");
      } else {
        showToast(errorMessage, "error");
      }

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className={`border border-translucent-emerald bg-muted-moss p-4 ${className}`}>
        <p className="text-bone-white/70 font-mono text-sm">Loading...</p>
      </div>
    );
  }

  // Discussion page: Guests see login prompt
  if (!isSignedIn && isDiscussion) {
    return (
      <div className={`border border-translucent-emerald bg-muted-moss p-4 ${className}`}>
        <p className="mb-3 text-sm text-bone-white/70 font-mono">
          Login to Post
        </p>
        <p className="mb-4 text-xs text-bone-white/50 font-mono">
          Only verified SMEs can contribute to discussion signals.
        </p>
        <SignInButton mode="modal">
          <Button variant="outline" className="text-sm px-4 py-2 font-mono">
            Sign In
          </Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-3 border border-translucent-emerald bg-muted-moss p-4 relative transition-all duration-300 ease-in-out ${className}`}
    >
      {/* User Identity Section */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-translucent-emerald/50">
        {isSignedIn && user ? (
          <>
            <AvatarLink
              userId={user.id}
              username={user.username || undefined}
              avatarUrl={user.imageUrl}
              fullName={user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || user.emailAddresses[0]?.emailAddress || "User"}
              size={32}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-bone-white font-mono">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || user.username || "User"}
              </p>
              {user.username && (
                <p className="text-xs text-bone-white/60 font-mono">
                  @{user.username}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex-shrink-0">
              <UserCircle size={32} className="text-bone-white/40" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest Name"
                required
                minLength={2}
                maxLength={50}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none font-mono"
                style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
              />
            </div>
            <span className="border border-gray-500/50 bg-gray-500/20 px-2 py-1 text-xs font-medium text-gray-400 font-mono uppercase whitespace-nowrap">
              GUEST
            </span>
          </>
        )}
      </div>

      {/* Star Rating Input (Products Only) */}
      {type === "product" && (
        <div className="space-y-2 pb-3 border-b border-translucent-emerald/50">
          <label className="block text-xs font-mono uppercase tracking-wider text-bone-white/70">
            Rate this product (optional)
          </label>
          <StarRatingInput
            value={starRating}
            onChange={setStarRating}
            size="md"
            disabled={loading}
          />
        </div>
      )}

      {/* Comment Textarea with Emoji Picker */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onClick={handleTextareaClick}
          onKeyUp={handleTextareaKeyUp}
          placeholder={
            isSignedIn
              ? type === "product"
                ? "Share your thoughts... Use [[ to cite from SME Citations"
                : "Write a comment... Use [[ to cite from SME Citations"
              : "Write a comment... (Guest comments require AI moderation)"
          }
          rows={4}
          className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all resize-none font-mono"
          style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
          required
          minLength={isSignedIn ? 3 : 10}
          maxLength={2000}
        />
        {/* Emoji Picker Button */}
        <div className="absolute bottom-2 right-2">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      </div>

      {/* Citation Search (only for discussions) */}
      {type === "discussion" && (
        <>
          <CitationSearch
            textareaRef={textareaRef}
            onSelect={(resourceId, resourceTitle) => {
              console.log("Citation added:", resourceId, resourceTitle);
            }}
            onContentChange={(newContent) => {
              setContent(newContent);
            }}
          />

          {/* Citation Input */}
          <div className="mt-2">
            <CitationInput
              onAddReference={(ref) => {
                if (references.length < 5 && onReferenceChange) {
                  onReferenceChange([...references, ref]);
                }
              }}
              onRemoveReference={(resourceId) => {
                if (onReferenceChange) {
                  onReferenceChange(references.filter((ref) => ref.resource_id !== resourceId));
                }
              }}
              references={references}
              maxReferences={5}
            />
          </div>

          {/* Source Preview - Show when citations are added */}
          {references.length > 0 && references[0].resource_url && (
            <div className="mt-2">
              <SourcePreviewCard url={references[0].resource_url} />
            </div>
          )}

          {/* Pillar Selector - Required for Verified Insights */}
          {postType === 'verified_insight' && (
            <div className="mt-3">
              <PillarSelector
                value={pillarOfTruth}
                onChange={setPillarOfTruth}
                required={true}
              />
            </div>
          )}
        </>
      )}

      {/* Source Link Input (only for products) */}
      {type === "product" && (
        <>
          <SourceLinkInput
            value={sourceLink}
            onChange={setSourceLink}
          />

          {/* Post Type Badge - Real-time feedback */}
          <div className="flex items-center gap-2 mt-2">
            <PostTypeBadge postType={postType} size="sm" />
            {postType === 'verified_insight' && (
              <span className="text-xs text-emerald-400 font-mono">
                Evidence detected - select pillar below
              </span>
            )}
          </div>

          {/* Source Preview - Show when link is added */}
          {sourceLink && (
            <div className="mt-2">
              <SourcePreviewCard url={sourceLink} />
            </div>
          )}

          {/* Pillar Selector - Required for Verified Insights */}
          {postType === 'verified_insight' && (
            <div className="mt-3">
              <PillarSelector
                value={pillarOfTruth}
                onChange={setPillarOfTruth}
                required={true}
              />
            </div>
          )}
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded border border-red-500/50 bg-red-500/10 p-2 text-xs text-red-400 font-mono">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        {!isSignedIn && (
          <p className="text-xs text-bone-white/50 font-mono">
            Guest comments are moderated for quality
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !content.trim() || (!isSignedIn && !guestName.trim())}
          className="flex items-center gap-2 text-xs font-mono border border-sme-gold bg-sme-gold text-bone-white hover:bg-[#9A7209] hover:border-[#9A7209] hover:text-bone-white uppercase tracking-wider active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send size={14} />
              {type === "product" ? "Post Comment" : "Post Signal"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}


