"use client";

import { useState } from "react";
import { X, Copy, Check, Mail } from "lucide-react";
import Button from "@/components/ui/Button";
import { markInviteSent } from "@/app/actions/outreach-actions";

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    slug: string;
  };
  onInviteSent?: () => void;
}

export default function OutreachModal({
  isOpen,
  onClose,
  product,
  onInviteSent,
}: OutreachModalProps) {
  const [copied, setCopied] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);

  if (!isOpen) return null;

  // Extract brand name from product title (assuming format like "Brand Name - Product Name" or just "Product Name")
  const brandName = product.title.includes(" - ")
    ? product.title.split(" - ")[0]
    : "Brand Name";
  const productName = product.title.includes(" - ")
    ? product.title.split(" - ").slice(1).join(" - ")
    : product.title;

  const productLink = `${typeof window !== "undefined" ? window.location.origin : ""}/products/${product.slug}`;

  const emailTemplate = `Subject: Invitation to SME Certification Program - ${productName}

Dear ${brandName} Team,

We hope this message finds you well. We're reaching out from the SME (Subject Matter Expert) Certification Program, a community-driven platform dedicated to verifying and showcasing high-quality health and wellness products through rigorous scientific validation.

We've identified ${productName} as a product that aligns with our community's values and standards. We'd like to extend an invitation for you to participate in our Certified SME program.

About Our Certification Program:

Our 9-Pillar Analysis ensures complete transparency and scientific rigor:
1. Purity
2. Bioavailability
3. Potency
4. Evidence
5. Sustainability
6. Experience
7. Safety
8. Transparency
9. Synergy

What Sets Us Apart:

• We verify raw COA documents directly from independent third-party laboratories
• We don't accept marketing claims or brand summaries - only verified laboratory test results
• Our certification process is transparent and science-backed

Benefits of Certification:

• Priority indexing in our SME Citations
• Visibility within our community of Trusted Voices (experts, researchers, practitioners)
• Direct-to-site funneling through our "Buy via SME Partner" feature
• Enhanced credibility with health-conscious consumers who value verified, science-backed products

Your Product on Our Platform:

We currently have ${productName} listed on our platform:
${productLink}

Next Steps:

If you're interested in pursuing certification, we'd be happy to guide you through the process. This includes:
• Reviewing your existing COA documents
• Verifying compliance with our 9-Pillar Analysis
• Completing the certification checklist

To learn more about our standards and requirements, please visit:
${typeof window !== "undefined" ? window.location.origin : ""}/standards

We're here to answer any questions you may have. Please don't hesitate to reach out if you'd like to discuss this opportunity further.

Best regards,
The SME Certification Team

---
This is an automated invitation. For questions, please contact us through our platform.`;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleMarkAsSent = async () => {
    setMarkingSent(true);
    try {
      await markInviteSent(product.id);
      if (onInviteSent) {
        onInviteSent();
      }
      onClose();
    } catch (err) {
      console.error("Failed to mark invite as sent:", err);
      alert("Failed to mark invite as sent. Please try again.");
    } finally {
      setMarkingSent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-soft-clay/20 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-earth-green" />
            <h2 className="text-xl font-semibold text-deep-stone">
              Certification Invitation Email
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-deep-stone/60 transition-colors hover:bg-soft-clay/20 hover:text-deep-stone"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-6">
          {/* Dynamic Fields Info */}
          <div className="mb-6 rounded-lg border border-earth-green/20 bg-earth-green/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-deep-stone">
              Dynamic Fields (Auto-populated):
            </h3>
            <div className="space-y-1 text-sm text-deep-stone/70">
              <p>
                <strong>Brand Name:</strong> {brandName}
              </p>
              <p>
                <strong>Product Name:</strong> {productName}
              </p>
              <p>
                <strong>Product Link:</strong>{" "}
                <a
                  href={productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-earth-green hover:underline"
                >
                  {productLink}
                </a>
              </p>
            </div>
          </div>

          {/* Email Template */}
          <div className="rounded-lg border border-soft-clay/20 bg-sand-beige/30 p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm text-deep-stone leading-relaxed">
              {emailTemplate}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-soft-clay/20 bg-white px-6 py-4">
          <div className="text-sm text-deep-stone/60">
            Copy the email above and send it to the brand
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCopyEmail}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy Email
                </>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={handleMarkAsSent}
              disabled={markingSent}
              className="flex items-center gap-2"
            >
              <Mail size={16} />
              {markingSent ? "Marking..." : "Mark as Sent"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}




