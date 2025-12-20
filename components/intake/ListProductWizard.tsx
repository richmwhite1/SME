"use client";

import { useState } from "react";
import { X, ArrowRight, ArrowLeft, Upload, Check } from "lucide-react";
import { submitProductIntake } from "@/app/actions/intake-actions";
import { useToast } from "@/components/ui/ToastContainer";
import Button from "@/components/ui/Button";

interface ListProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3;

export default function ListProductWizard({ isOpen, onClose }: ListProductWizardProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"standard" | "featured">("standard");
  const [wantsCertification, setWantsCertification] = useState(false);
  const [email, setEmail] = useState("");
  const [purityDocFile, setPurityDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [purityDocUrl, setPurityDocUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      // For now, we'll store the file info and upload later
      // In production, you'd upload to Supabase Storage here
      setPurityDocFile(file);
      // Simulate upload - replace with actual Supabase Storage upload
      const mockUrl = `purity-docs/${Date.now()}-${file.name}`;
      setPurityDocUrl(mockUrl);
      showToast("Document uploaded successfully", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to upload document", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (currentStep !== 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
      return;
    }

    setSubmitting(true);
    try {
      await submitProductIntake(
        productName,
        description,
        tier,
        wantsCertification,
        email,
        purityDocUrl || undefined,
        purityDocFile?.name
      );
      showToast("Product submission successful", "success");
      // Reset form
      setCurrentStep(1);
      setProductName("");
      setDescription("");
      setTier("standard");
      setWantsCertification(false);
      setEmail("");
      setPurityDocFile(null);
      setPurityDocUrl(null);
      onClose();
    } catch (error: any) {
      showToast(error.message || "Failed to submit product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return productName.trim().length >= 2 && description.trim().length >= 20;
    }
    if (currentStep === 2) {
      return tier !== null;
    }
    if (currentStep === 3) {
      if (!email.trim() || !email.includes("@")) return false;
      if (wantsCertification && !purityDocUrl) return false;
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform">
        <div className="border border-bone-white/20 bg-forest-obsidian p-6 font-mono max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-bone-white uppercase tracking-wider">
                List Your Product
              </h2>
              <p className="text-xs text-bone-white/50 mt-1">
                Step {currentStep} of 3
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-bone-white/70 hover:text-bone-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6 flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 ${
                  step <= currentStep
                    ? "bg-emerald-400"
                    : "bg-bone-white/20"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-bone-white uppercase tracking-wider mb-4">
                Basic Information
              </h3>
              <div>
                <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono resize-none"
                  placeholder="Describe your product, its benefits, and key features (minimum 20 characters)..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Tier Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-bone-white uppercase tracking-wider mb-4">
                Listing Tier
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTier("standard")}
                  className={`border p-6 text-left transition-all ${
                    tier === "standard"
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-bone-white/20 bg-bone-white/5 hover:border-bone-white/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-bone-white">Standard</h4>
                    {tier === "standard" && (
                      <Check className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-bone-white mb-1">$0/mo</p>
                  <p className="text-xs text-bone-white/70">
                    Free promotional listing with basic features
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTier("featured")}
                  className={`border p-6 text-left transition-all ${
                    tier === "featured"
                      ? "border-sme-gold bg-sme-gold/10"
                      : "border-bone-white/20 bg-bone-white/5 hover:border-bone-white/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-bone-white">Featured</h4>
                    {tier === "featured" && (
                      <Check className="h-5 w-5 text-sme-gold" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-bone-white mb-1">$100/mo</p>
                  <p className="text-xs text-bone-white/70">
                    Premium placement and enhanced visibility
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Certification & Contact */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-bone-white uppercase tracking-wider mb-4">
                Certification & Contact
              </h3>
              <div>
                <label className="mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wantsCertification}
                    onChange={(e) => setWantsCertification(e.target.checked)}
                    className="h-4 w-4 border-translucent-emerald bg-forest-obsidian text-emerald-400 focus:ring-emerald-400"
                  />
                  <span className="text-sm text-bone-white font-mono">
                    I want to apply for SME Certification
                  </span>
                </label>
              </div>

              {wantsCertification && (
                <div>
                  <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                    Purity Test / Gold Standard Documentation *
                  </label>
                  <div className="border border-translucent-emerald bg-forest-obsidian p-4">
                    {purityDocUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm text-bone-white">
                            {purityDocFile?.name || "Document uploaded"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPurityDocFile(null);
                            setPurityDocUrl(null);
                          }}
                          className="text-xs text-bone-white/50 hover:text-bone-white"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-4">
                        <Upload className="h-8 w-8 text-bone-white/50" />
                        <span className="text-sm text-bone-white/70">
                          Click to upload or drag and drop
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

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
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex gap-3">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as Step)}
                className="flex items-center gap-2 border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10 text-xs font-mono px-4 py-2 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || submitting || uploading}
              className="ml-auto flex items-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-4 py-2 transition-colors disabled:opacity-50"
            >
              {currentStep === 3 ? (
                submitting ? (
                  "Submitting..."
                ) : (
                  "Submit Product"
                )
              ) : (
                <>
                  Next
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

