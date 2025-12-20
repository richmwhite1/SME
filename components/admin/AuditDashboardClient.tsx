"use client";

import { useState } from "react";
import { FileText, Eye } from "lucide-react";
import VerificationModal from "./VerificationModal";

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

interface AuditDashboardClientProps {
  submissions: EvidenceSubmission[];
}

export default function AuditDashboardClient({
  submissions,
}: AuditDashboardClientProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<EvidenceSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReview = (submission: EvidenceSubmission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  if (submissions.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-bone-white/70 font-mono text-sm">
          No pending audits. The queue is clear.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-translucent-emerald">
              <th className="border-r border-translucent-emerald p-4 text-left">
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white">
                  Product
                </span>
              </th>
              <th className="border-r border-translucent-emerald p-4 text-left">
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white">
                  Lab Name
                </span>
              </th>
              <th className="border-r border-translucent-emerald p-4 text-left">
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white">
                  Batch #
                </span>
              </th>
              <th className="p-4 text-left">
                <span className="font-mono text-xs uppercase tracking-wider text-bone-white">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                className="border-b border-translucent-emerald hover:bg-forest-obsidian transition-colors"
              >
                <td className="border-r border-translucent-emerald p-4">
                  <span className="font-mono text-sm text-bone-white">
                    {submission.protocols?.title || "Unknown Product"}
                  </span>
                </td>
                <td className="border-r border-translucent-emerald p-4">
                  <span className="font-mono text-sm text-bone-white/80">
                    {submission.lab_name || "N/A"}
                  </span>
                </td>
                <td className="border-r border-translucent-emerald p-4">
                  <span className="font-mono text-sm text-bone-white/80">
                    {submission.batch_number || "N/A"}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleReview(submission)}
                    className="inline-flex items-center gap-2 border border-translucent-emerald bg-transparent px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-bone-white hover:bg-forest-obsidian hover:border-heart-green transition-colors"
                  >
                    <Eye size={14} />
                    View Document
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <VerificationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          submission={selectedSubmission}
        />
      )}
    </>
  );
}



