"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createDiscussion } from "@/app/actions/discussion-actions";
import Button from "@/components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Tooltip from "@/components/ui/Tooltip";
import TaggingInput from "@/components/topics/TaggingInput";
import { useToast } from "@/components/ui/ToastContainer";

export default function NewDiscussionPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/discussions");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="min-h-screen bg-forest-obsidian px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="border border-translucent-emerald bg-muted-moss p-8 text-center">
            <p className="text-bone-white/70">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await createDiscussion(title, content, tags, referenceUrl.trim() || undefined);
      if (result.success && result.id) {
        // Show success toast
        showToast("Discussion created successfully", "success");
        // Redirect to the new discussion page using ID
        router.push(`/discussions/${result.id}`);
      } else {
        const errorMsg = "Discussion created but ID not returned. Please refresh the page.";
        setError(errorMsg);
        showToast(errorMsg, "error");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create discussion";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/discussions"
          className="mb-6 inline-flex items-center gap-2 text-bone-white/70 hover:text-bone-white font-mono transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Discussions
        </Link>

        <div className="border border-translucent-emerald bg-muted-moss p-8">
          <h1 className="mb-6 font-serif text-3xl font-bold text-bone-white">Start a Discussion</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-bone-white font-mono">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What would you like to discuss?"
                required
                minLength={5}
                maxLength={200}
                className="w-full border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none font-mono"
              />
              <p className="mt-1 text-xs text-bone-white/50 font-mono">
                {title.length}/200 characters (minimum 5)
              </p>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium text-bone-white font-mono">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, questions, or insights..."
                required
                minLength={20}
                rows={8}
                className="w-full border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none font-mono"
              />
              <p className="mt-1 text-xs text-bone-white/50 font-mono">
                {content.length} characters (minimum 20)
              </p>
            </div>

            {/* Reference URL */}
            <div>
              <label
                htmlFor="referenceUrl"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-bone-white font-mono"
              >
                Reference URL (optional)
                <Tooltip content="Only links from Trusted Voices appear in SME Citations.">
                  <span className="cursor-help text-bone-white/50 hover:text-bone-white/70">
                    ℹ️
                  </span>
                </Tooltip>
              </label>
              <input
                type="url"
                id="referenceUrl"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://example.com/source"
                className="w-full border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none font-mono"
              />
              <p className="mt-1 text-xs text-bone-white/50 font-mono">
                Add a source link to support your discussion
              </p>
            </div>

            {/* Topic Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-bone-white font-mono">
                Topic Tags (optional, max 5)
              </label>
              <TaggingInput selectedTags={tags} onTagsChange={setTags} maxTags={5} />
            </div>

            {error && (
              <div className="border border-heart-green bg-heart-green/10 p-4 text-sm text-heart-green font-mono">{error}</div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || title.length < 5 || content.length < 20}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Discussion"
                )}
              </Button>
              <Link href="/discussions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

