"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import SubmitEvidenceModal from "./SubmitEvidenceModal";

interface SubmitEvidenceButtonProps {
  productId: string;
  productTitle: string;
}

export default function SubmitEvidenceButton({
  productId,
  productTitle,
}: SubmitEvidenceButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 border border-sme-gold bg-transparent px-4 py-2 text-sm font-mono uppercase tracking-wider text-sme-gold hover:bg-sme-gold hover:text-forest-obsidian transition-colors"
      >
        <FileUp size={16} />
        Submit Lab Evidence
      </button>

      <SubmitEvidenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productTitle={productTitle}
      />
    </>
  );
}



