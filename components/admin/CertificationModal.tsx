"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { toggleProductCertification } from "@/app/actions/admin-actions";
import { useRouter } from "next/navigation";

interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolId: string;
  currentStatus: boolean;
  currentData?: {
    certification_notes?: string | null;
    third_party_lab_verified?: boolean;
    purity_tested?: boolean;
    source_transparency?: boolean;
    potency_verified?: boolean;
    excipient_audit?: boolean;
    operational_legitimacy?: boolean;
    coa_url?: string | null;
  };
}

export default function CertificationModal({
  isOpen,
  onClose,
  protocolId,
  currentStatus,
  currentData,
}: CertificationModalProps) {
  const router = useRouter();
  const [isCertified, setIsCertified] = useState(currentStatus);
  const [certificationNotes, setCertificationNotes] = useState(
    currentData?.certification_notes || ""
  );
  const [thirdPartyLabVerified, setThirdPartyLabVerified] = useState(
    currentData?.third_party_lab_verified || false
  );
  const [purityTested, setPurityTested] = useState(
    currentData?.purity_tested || false
  );
  const [sourceTransparency, setSourceTransparency] = useState(
    currentData?.source_transparency || false
  );
  const [potencyVerified, setPotencyVerified] = useState(
    currentData?.potency_verified || false
  );
  const [excipientAudit, setExcipientAudit] = useState(
    currentData?.excipient_audit || false
  );
  const [operationalLegitimacy, setOperationalLegitimacy] = useState(
    currentData?.operational_legitimacy || false
  );
  const [coaUrl, setCoaUrl] = useState(currentData?.coa_url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await toggleProductCertification(protocolId, isCertified, {
        certification_notes: certificationNotes || undefined,
        third_party_lab_verified: thirdPartyLabVerified,
        purity_tested: purityTested,
        source_transparency: sourceTransparency,
        potency_verified: potencyVerified,
        excipient_audit: excipientAudit,
        operational_legitimacy: operationalLegitimacy,
        coa_url: coaUrl || undefined,
      });

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update certification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-deep-stone">
            {isCertified ? "Update Certification" : "Certify Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-deep-stone/60 hover:text-deep-stone"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Certification Status Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-soft-clay/30 bg-white/50 p-4">
            <div>
              <label className="text-sm font-medium text-deep-stone">
                SME Certification Status
              </label>
              <p className="text-xs text-deep-stone/60">
                {isCertified
                  ? "Product is currently certified"
                  : "Product is not certified"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCertified(!isCertified)}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                isCertified ? "bg-earth-green" : "bg-soft-clay/50"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                  isCertified ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 5 Pillars Checklist */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-deep-stone">
              5 Verification Pillars
            </h3>
            <div className="space-y-2 rounded-lg border border-soft-clay/30 bg-white/50 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={sourceTransparency}
                  onChange={(e) => setSourceTransparency(e.target.checked)}
                  className="h-5 w-5 rounded border-soft-clay/30 text-earth-green focus:ring-earth-green"
                />
                <span className="font-medium text-deep-stone">Source Transparency</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={purityTested}
                  onChange={(e) => setPurityTested(e.target.checked)}
                  className="h-5 w-5 rounded border-soft-clay/30 text-earth-green focus:ring-earth-green"
                />
                <span className="font-medium text-deep-stone">Purity</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={potencyVerified}
                  onChange={(e) => setPotencyVerified(e.target.checked)}
                  className="h-5 w-5 rounded border-soft-clay/30 text-earth-green focus:ring-earth-green"
                />
                <span className="font-medium text-deep-stone">Potency</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={excipientAudit}
                  onChange={(e) => setExcipientAudit(e.target.checked)}
                  className="h-5 w-5 rounded border-soft-clay/30 text-earth-green focus:ring-earth-green"
                />
                <span className="font-medium text-deep-stone">Excipient Audit</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={operationalLegitimacy}
                  onChange={(e) => setOperationalLegitimacy(e.target.checked)}
                  className="h-5 w-5 rounded border-soft-clay/30 text-earth-green focus:ring-earth-green"
                />
                <span className="font-medium text-deep-stone">Operational Legitimacy</span>
              </label>
            </div>
          </div>

          {/* Legacy Fields (for backward compatibility) */}
          <div className="space-y-2 rounded-lg border border-soft-clay/30 bg-white/50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={thirdPartyLabVerified}
                onChange={(e) => setThirdPartyLabVerified(e.target.checked)}
                className="h-5 w-5 rounded border-soft-clay/30 text-earth-green focus:ring-earth-green"
              />
              <span className="font-medium text-deep-stone">3rd Party Lab Verified</span>
            </label>
          </div>

          {/* COA URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-deep-stone">
              COA URL (Certificate of Analysis)
            </label>
            <input
              type="url"
              value={coaUrl}
              onChange={(e) => setCoaUrl(e.target.value)}
              placeholder="https://example.com/coa.pdf"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>

          {/* Certification Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-deep-stone">
              Certification Notes
            </label>
            <textarea
              value={certificationNotes}
              onChange={(e) => setCertificationNotes(e.target.value)}
              placeholder="Add any notes about the certification process, verification details, or special considerations..."
              rows={4}
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Certification"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}





