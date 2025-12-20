"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { submitBrandApplication } from "@/app/actions/intake-actions";
import { useToast } from "@/components/ui/ToastContainer";
import Button from "@/components/ui/Button";

interface GetCertifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GetCertifiedModal({ isOpen, onClose }: GetCertifiedModalProps) {
  const { showToast } = useToast();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [productInterest, setProductInterest] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await submitBrandApplication(businessName, email, productInterest);
      showToast("Application submitted successfully", "success");
      setBusinessName("");
      setEmail("");
      setProductInterest("");
      onClose();
    } catch (error: any) {
      showToast(error.message || "Failed to submit application", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform">
        <div className="border border-bone-white/20 bg-forest-obsidian p-6 font-mono">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-bone-white uppercase tracking-wider">
              Get Certified
            </h2>
            <button
              onClick={onClose}
              className="text-bone-white/70 hover:text-bone-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="Your business name"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                Product Interest
              </label>
              <textarea
                value={productInterest}
                onChange={(e) => setProductInterest(e.target.value)}
                rows={3}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono resize-none"
                placeholder="Tell us about the products you'd like to certify..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-4 py-2 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10 text-xs font-mono px-4 py-2 transition-colors"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

