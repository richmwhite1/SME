"use client";

import { useState } from "react";
import { BadgeCheck, X } from "lucide-react";

interface CertifiedSMEBadgeProps {
  certificationNotes: string | null;
  hasCertification: boolean;
}

export default function CertifiedSMEBadge({
  certificationNotes,
  hasCertification,
}: CertifiedSMEBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!hasCertification || !certificationNotes) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full bg-earth-green/20 px-4 py-2 text-sm font-medium text-earth-green transition-all duration-200 hover:bg-earth-green/30 hover:scale-105"
      >
        <BadgeCheck size={18} className="text-earth-green" />
        <span>Certified SME</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-deep-stone/40 hover:text-deep-stone"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-earth-green/20">
                <BadgeCheck size={24} className="text-earth-green" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-deep-stone">Certified SME</h2>
                <p className="text-sm text-deep-stone/60">Due Diligence Report</p>
              </div>
            </div>

            {/* Certification Notes */}
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap rounded-lg bg-sand-beige/50 p-4 text-deep-stone">
                {certificationNotes}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-earth-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-earth-green/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




