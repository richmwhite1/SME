"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { resolveBounty } from "@/app/actions/discussion-actions";
import { useToast } from "@/components/ui/ToastContainer";
import Button from "@/components/ui/Button";

interface AcceptSolutionButtonProps {
  discussionId: string;
  commentId: string;
  discussionSlug: string;
}

export default function AcceptSolutionButton({
  discussionId,
  commentId,
  discussionSlug,
}: AcceptSolutionButtonProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!confirm("Accept this comment as the solution? This will resolve the bounty and award reputation to the contributor.")) {
      return;
    }

    setLoading(true);
    try {
      await resolveBounty(discussionId, commentId, discussionSlug);
      showToast("Bounty resolved! Reputation awarded to contributor.", "success");
      // Refresh the page to show updated status
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resolve bounty";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAccept}
      disabled={loading}
      className="flex items-center gap-2 text-xs font-mono border border-heart-green bg-heart-green/20 text-heart-green hover:bg-heart-green/30 hover:border-heart-green uppercase tracking-wider"
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CheckCircle2 size={14} />
          Accept as Solution
        </>
      )}
    </Button>
  );
}



