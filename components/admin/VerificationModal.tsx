"use client";

import { useState } from "react";
import { X, Check, XCircle, Flag } from "lucide-react";
import { useToast } from "@/components/ui/ToastContainer";
import { createClient } from "@/lib/supabase/client";

interface EvidenceSubmission {
  id: string;
  protocol_id: string;
  lab_name: string | null;
  batch_number: string | null;
  document_url: string | null;
  document_type: string | null;
  status: string;
  submitted_at: string;
  protocols: {
    id: string;
    title: string;
  } | null;
}

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: EvidenceSubmission;
}

export default function VerificationModal({
  isOpen,
  onClose,
  submission,
}: VerificationModalProps) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (action: "approve" | "reject" | "flag") => {
    setIsProcessing(true);
    try {
      const supabase = createClient();
      
      let newStatus: string;
      switch (action) {
        case "approve":
          newStatus = "approved";
          break;
        case "reject":
          newStatus = "rejected";
          break;
        case "flag":
          newStatus = "flagged_for_admin";
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from("evidence_submissions")
        // @ts-ignore - Supabase type system limitation
        .update({ status: newStatus })
        .eq("id", submission.id);

      if (error) {
        throw error;
      }

      showToast(
        action === "approve"
          ? "Specimen approved successfully"
          : action === "reject"
          ? "Specimen rejected"
          : "Flagged for admin review",
        "success"
      );

      // Refresh the page to update the queue
      window.location.reload();
    } catch (error) {
      console.error("Error processing action:", error);
      showToast("Failed to process action", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const isImage = submission.document_type?.startsWith("image/");
  const isPdf = submission.document_type === "application/pdf" || submission.document_url?.endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-7xl border border-translucent-emerald bg-muted-moss">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-translucent-emerald p-4">
          <h2 className="font-mono text-sm uppercase tracking-wider text-bone-white">
            Verification Review
          </h2>
          <button
            onClick={onClose}
            className="text-bone-white/70 hover:text-bone-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-0">
          {/* Document Viewer */}
          <div className="border-r border-translucent-emerald p-6">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-bone-white">
              Document
            </h3>
            <div className="relative aspect-video border border-translucent-emerald bg-forest-obsidian">
              {submission.document_url ? (
                <>
                  {isImage ? (
                    <img
                      src={submission.document_url}
                      alt="Evidence document"
                      className="h-full w-full object-contain"
                    />
                  ) : isPdf ? (
                    <iframe
                      src={submission.document_url}
                      className="h-full w-full"
                      title="Evidence document"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="font-mono text-sm text-bone-white/70">
                        Document type not supported for preview
                      </p>
                      <a
                        href={submission.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-sme-gold hover:underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="font-mono text-sm text-bone-white/70">
                    No document available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submission Data */}
          <div className="p-6">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-bone-white">
              Submission Data
            </h3>
            <div className="space-y-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white/70">
                  Product:
                </span>
                <p className="mt-1 font-mono text-sm text-bone-white">
                  {submission.protocols?.title || "Unknown"}
                </p>
              </div>
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white/70">
                  Lab Name:
                </span>
                <p className="mt-1 font-mono text-sm text-bone-white">
                  {submission.lab_name || "N/A"}
                </p>
              </div>
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white/70">
                  Batch Number:
                </span>
                <p className="mt-1 font-mono text-sm text-bone-white">
                  {submission.batch_number || "N/A"}
                </p>
              </div>
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white/70">
                  Document Type:
                </span>
                <p className="mt-1 font-mono text-sm text-bone-white">
                  {submission.document_type || "N/A"}
                </p>
              </div>
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white/70">
                  Submitted At:
                </span>
                <p className="mt-1 font-mono text-sm text-bone-white">
                  {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => handleAction("approve")}
                disabled={isProcessing}
                className="w-full border border-heart-green bg-heart-green px-4 py-2 text-sm font-mono uppercase tracking-wider text-forest-obsidian hover:bg-[#0E9B6E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Approve Specimen
              </button>
              <button
                onClick={() => handleAction("reject")}
                disabled={isProcessing}
                className="w-full border border-red-500 bg-red-500 px-4 py-2 text-sm font-mono uppercase tracking-wider text-bone-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle size={16} />
                Reject
              </button>
              <button
                onClick={() => handleAction("flag")}
                disabled={isProcessing}
                className="w-full border border-[#B8860B] bg-[#B8860B] px-4 py-2 text-sm font-mono uppercase tracking-wider text-forest-obsidian hover:bg-[#9A7209] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Flag size={16} />
                Flag for Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



