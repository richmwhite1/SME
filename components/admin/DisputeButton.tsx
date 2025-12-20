"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { submitDispute } from "@/app/actions/admin-actions";
import { useToast } from "@/components/ui/ToastContainer";
import Button from "@/components/ui/Button";

interface DisputeButtonProps {
  queueItemId: string;
  authorId: string | null;
  currentUserId: string;
  status?: string;
}

export default function DisputeButton({
  queueItemId,
  authorId,
  currentUserId,
  status,
}: DisputeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Only show to comment author
  if (!authorId || authorId !== currentUserId || status === "disputed") {
    return null;
  }

  const handleSubmit = async () => {
    if (!disputeReason.trim() || disputeReason.trim().length < 10) {
      showToast("Please provide a reason (at least 10 characters)", "error");
      return;
    }

    setSubmitting(true);
    try {
      await submitDispute(queueItemId, disputeReason);
      showToast("Dispute submitted successfully", "success");
      setIsOpen(false);
      setDisputeReason("");
    } catch (error: any) {
      showToast(error.message || "Failed to submit dispute", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border-yellow-500/50 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-mono px-3 py-1.5 transition-colors"
      >
        <AlertCircle className="h-3 w-3" />
        Dispute Removal
      </Button>
    );
  }

  return (
    <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded font-mono">
      <p className="text-xs text-bone-white/70 mb-2 uppercase tracking-wider">
        Dispute Removal
      </p>
      <textarea
        value={disputeReason}
        onChange={(e) => setDisputeReason(e.target.value)}
        placeholder="Explain why this comment should be restored..."
        className="w-full bg-forest-obsidian border border-bone-white/20 text-bone-white p-2 rounded text-sm mb-2 font-mono"
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !disputeReason.trim()}
          className="flex items-center gap-2 border-yellow-500/50 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-mono px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Dispute"}
        </Button>
        <Button
          onClick={() => {
            setIsOpen(false);
            setDisputeReason("");
          }}
          className="flex items-center gap-2 border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10 text-xs font-mono px-3 py-1.5 transition-colors"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

