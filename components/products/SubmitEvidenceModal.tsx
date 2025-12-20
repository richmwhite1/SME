"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, Check } from "lucide-react";
import { submitLabEvidence } from "@/app/actions/evidence-actions";
import { useToast } from "@/components/ui/ToastContainer";

interface SubmitEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
}

export default function SubmitEvidenceModal({
  isOpen,
  onClose,
  productId,
  productTitle,
}: SubmitEvidenceModalProps) {
  const { showToast } = useToast();
  const [labName, setLabName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("File must be a PDF or image (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!selectedFile) {
      setError("Please select a document to upload");
      setLoading(false);
      return;
    }

    if (!isConfirmed) {
      setError("Please confirm that the document is genuine");
      setLoading(false);
      return;
    }

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert file to base64"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      await submitLabEvidence(
        productId,
        labName.trim(),
        batchNumber.trim(),
        base64,
        selectedFile.name,
        selectedFile.type,
        isConfirmed
      );

      showToast("Evidence submitted successfully. Pending verification.", "success");
      
      // Reset form
      setLabName("");
      setBatchNumber("");
      setSelectedFile(null);
      setIsConfirmed(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit evidence";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-forest-obsidian/90"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl border border-translucent-emerald bg-muted-moss p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-translucent-emerald pb-4">
            <div>
              <h2 className="font-serif text-xl font-semibold text-bone-white">
                Submit Lab Evidence
              </h2>
              <p className="mt-1 text-xs text-bone-white/70 font-mono">
                {productTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-bone-white/70 hover:text-bone-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lab Name */}
            <div>
              <label
                htmlFor="labName"
                className="block text-sm font-mono uppercase tracking-wider text-bone-white mb-2"
              >
                Lab Name
              </label>
              <input
                id="labName"
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                required
                className="w-full border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="Enter laboratory name"
              />
            </div>

            {/* Batch Number */}
            <div>
              <label
                htmlFor="batchNumber"
                className="block text-sm font-mono uppercase tracking-wider text-bone-white mb-2"
              >
                Batch Number
              </label>
              <input
                id="batchNumber"
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                required
                className="w-full border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="Enter batch or lot number"
              />
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="document"
                className="block text-sm font-mono uppercase tracking-wider text-bone-white mb-2"
              >
                Document (PDF or Image)
              </label>
              <div className="relative">
                <input
                  id="document"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                  required
                  className="hidden"
                />
                <label
                  htmlFor="document"
                  className="flex items-center gap-3 border border-translucent-emerald bg-forest-obsidian px-4 py-3 cursor-pointer hover:border-heart-green transition-colors"
                >
                  <Upload size={18} className="text-bone-white/70" />
                  <span className="text-sm text-bone-white/80 font-mono">
                    {selectedFile ? selectedFile.name : "Select PDF or Image"}
                  </span>
                </label>
              </div>
              {selectedFile && (
                <p className="mt-2 text-xs text-bone-white/60 font-mono">
                  File: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 border border-translucent-emerald bg-forest-obsidian p-4">
              <input
                id="confirm"
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 border-translucent-emerald bg-forest-obsidian text-sme-gold focus:ring-sme-gold focus:ring-offset-0"
              />
              <label
                htmlFor="confirm"
                className="text-sm text-bone-white font-mono leading-relaxed"
              >
                I confirm this document is a genuine Certificate of Analysis (COA) or Lab Report.
              </label>
            </div>

            {/* Pending State Notice */}
            <div className="border border-muted-amber/50 bg-muted-amber/10 p-3">
              <p className="text-xs text-muted-amber font-mono">
                ⚠️ Pending Audit: Your submission will be reviewed by the community. Status updates will appear here once verified.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="border border-red-500/50 bg-red-500/10 p-3">
                <p className="text-sm text-red-400 font-mono">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-translucent-emerald">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-mono uppercase tracking-wider text-bone-white/70 hover:text-bone-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 border border-sme-gold bg-sme-gold px-6 py-2 text-sm font-mono uppercase tracking-wider text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Submit Evidence
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}



