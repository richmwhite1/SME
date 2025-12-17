"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { createProductComment } from "@/app/actions/product-actions";
import Button from "@/components/ui/Button";
import { Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    badge_type: string | null;
  } | null;
}

interface ProductCommentsProps {
  protocolId: string;
  protocolSlug: string;
  initialComments: Comment[];
}

export default function ProductComments({
  protocolId,
  protocolSlug,
  initialComments,
}: ProductCommentsProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      await createProductComment(protocolId, content, protocolSlug);
      setContent("");
      // Refresh the page to show new comment
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-16 space-y-6 border-t border-soft-clay/20 pt-12">
      <h2 className="text-3xl font-semibold text-deep-stone">Comments</h2>

      {/* Comment Form */}
      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={4}
            className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            required
            minLength={3}
            maxLength={2000}
          />
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !content.trim()}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send size={16} />
                Post Comment
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="rounded-lg border border-soft-clay/30 bg-white/50 p-4">
          <p className="mb-3 text-sm text-deep-stone/70">
            Sign in to join the conversation
          </p>
          <SignInButton mode="modal">
            <Button variant="outline" className="text-sm px-4 py-2">
              Sign In
            </Button>
          </SignInButton>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-deep-stone/70">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-soft-clay/20 bg-white/50 p-4"
            >
              <div className="mb-3 flex items-start gap-3">
                {comment.profiles?.avatar_url ? (
                  <Image
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.full_name || "User"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-clay text-xs font-semibold text-deep-stone">
                    {comment.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-deep-stone">
                      {comment.profiles?.full_name || "Anonymous"}
                    </span>
                    {comment.profiles?.username && (
                      <span className="text-xs text-deep-stone/60">
                        @{comment.profiles.username}
                      </span>
                    )}
                    {comment.profiles?.badge_type === "Trusted Voice" && (
                      <span className="rounded-full bg-earth-green/20 px-2 py-0.5 text-xs font-medium text-earth-green">
                        Trusted Voice
                      </span>
                    )}
                    <span className="text-xs text-deep-stone/60">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-deep-stone/80">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

