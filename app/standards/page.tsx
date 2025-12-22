"use client";
import Link from "next/link";
import React from "react";
import { Check, FileText, Shield, FlaskConical, Microscope, Building2, ArrowRight, Download, Star } from "lucide-react";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface Pillar {
  name: string;
  icon: React.ReactElement;
  description: string;
  details: string[];
}

const pillars: Pillar[] = [
  {
    name: "Source Transparency",
    icon: <Building2 size={32} />,
    description: "Complete visibility into product origins and supply chain",
    details: [
      "Verified raw material sources",
      "Supply chain documentation",
      "Manufacturing location verification",
      "Full ingredient traceability"
    ],
  },
  {
    name: "Purity Screening",
    icon: <Microscope size={32} />,
    description: "Rigorous testing for contaminants and adulterants",
    details: [
      "Heavy metals screening",
      "Pesticide residue analysis",
      "Microbiological testing",
      "Adulterant detection"
    ],
  },
  {
    name: "Potency Audit",
    icon: <FlaskConical size={32} />,
    description: "Verified active ingredient concentrations match label claims",
    details: [
      "Active compound quantification",
      "Label claim verification",
      "Batch-to-batch consistency",
      "Third-party lab validation"
    ],
  },
  {
    name: "Excipient Cleanliness",
    icon: <Shield size={32} />,
    description: "Assessment of non-active ingredients for safety and quality",
    details: [
      "Filler and binder analysis",
      "Preservative screening",
      "Allergen identification",
      "Clean formulation verification"
    ],
  },
  {
    name: "Operational Legitimacy",
    icon: <FileText size={32} />,
    description: "Verification of business practices and regulatory compliance",
    details: [
      "cGMP facility certification",
      "Regulatory compliance checks",
      "Business license verification",
      "Ethical sourcing practices"
    ],
  },
];

export default function StandardsPage() {
  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-serif text-5xl font-bold text-bone-white md:text-6xl">
            Certified SME Standards
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-bone-white/70 md:text-2xl font-mono">
            Our rigorous 5-Pillar Framework ensures every certified product meets the highest
            standards of quality, transparency, and scientific validation.
          </p>
        </div>

        {/* Key Message */}
        <div className="mb-16 border-2 border-translucent-emerald bg-muted-moss p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <FileText size={32} className="text-heart-green flex-shrink-0" />
            <div>
              <h2 className="mb-3 font-serif text-xl md:text-2xl font-semibold text-bone-white">
                We Verify Raw COA Documents
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-bone-white/80 font-mono">
                Unlike other certification programs that rely on brand summaries or marketing
                materials, we require and verify <strong className="text-bone-white">raw Certificate of Analysis (COA)
                  documents</strong> directly from independent third-party laboratories. This ensures
                complete transparency and scientific accuracy in our certification process.
              </p>
            </div>
          </div>
        </div>

        {/* 5-Pillar Framework Grid */}
        <div className="mb-16">
          <h2 className="mb-8 font-serif text-center text-3xl font-bold text-bone-white md:text-4xl">
            The 5-Pillar Framework
          </h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, index) => (
              <div
                key={pillar.name}
                className="group relative border-2 border-translucent-emerald bg-muted-moss p-6 transition-all duration-300 hover:border-heart-green"
              >
                {/* Pillar Number */}
                <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center border border-heart-green bg-heart-green text-lg font-bold text-forest-obsidian font-mono">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="mb-4 flex items-center justify-center">
                  {React.cloneElement(pillar.icon, { className: "text-heart-green" })}
                </div>

                {/* Name */}
                <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white">
                  {pillar.name}
                </h3>

                {/* Description */}
                <p className="mb-4 text-bone-white/70 leading-relaxed font-mono">
                  {pillar.description}
                </p>

                {/* Details List */}
                <ul className="space-y-2">
                  {pillar.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start gap-2 text-sm text-bone-white/80 font-mono">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-heart-green" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Partners Section */}
        <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8 md:p-12">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Star className="h-8 w-8 text-sme-gold" />
              <h2 className="font-serif text-3xl font-bold text-bone-white md:text-4xl">
                Brand Partners
              </h2>
              <Star className="h-8 w-8 text-sme-gold" />
            </div>
            <p className="mx-auto max-w-3xl text-lg text-bone-white/70 md:text-xl font-mono">
              Join trusted brands that prioritize transparency and scientific validation.
              The SME Certification Program offers a rigorous, science-backed pathway to
              demonstrate your commitment to quality and transparency.
            </p>
          </div>

          {/* Professional Introduction */}
          <div className="mb-8 border border-translucent-emerald bg-forest-obsidian p-6">
            <h3 className="mb-4 font-serif text-xl font-semibold text-bone-white">
              Why Partner with SME?
            </h3>
            <p className="mb-4 leading-relaxed text-bone-white/80 font-mono">
              Our certification program is built on a foundation of scientific integrity and
              transparency. Unlike other certification programs that rely on brand summaries or
              marketing materials, we require and verify <strong className="text-bone-white">raw Certificate of Analysis (COA)
                documents</strong> directly from independent, accredited third-party laboratories.
            </p>
            <p className="leading-relaxed text-bone-white/80 font-mono">
              When your product earns the &quot;SME Certified&quot; badge, it signals to health-conscious
              consumers, researchers, and practitioners that your product has undergone our rigorous
              5-Pillar verification process and meets our highest standards for quality, purity, and
              transparency.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="mb-8 grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="border border-translucent-emerald bg-forest-obsidian p-6 transition-all hover:border-heart-green">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-translucent-emerald bg-muted-moss">
                  <FileText size={20} className="text-heart-green" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-bone-white">
                  Priority Indexing
                </h3>
              </div>
              <p className="text-bone-white/70 font-mono">
                Your products are featured prominently in our SME Citations, making them easily
                discoverable by researchers and health-conscious consumers seeking verified,
                science-backed solutions.
              </p>
            </div>

            <div className="border border-translucent-emerald bg-forest-obsidian p-6 transition-all hover:border-heart-green">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-translucent-emerald bg-muted-moss">
                  <Shield size={20} className="text-heart-green" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-bone-white">
                  Trusted Voice Visibility
                </h3>
              </div>
              <p className="text-bone-white/70 font-mono">
                Gain visibility within our community of Trusted Voices—experts, researchers, and
                practitioners who value verified, science-backed products and actively recommend
                them to their audiences.
              </p>
            </div>

            <div className="border border-translucent-emerald bg-forest-obsidian p-6 transition-all hover:border-heart-green">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-translucent-emerald bg-muted-moss">
                  <ArrowRight size={20} className="text-heart-green" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-bone-white">
                  Direct-to-Site Funneling
                </h3>
              </div>
              <p className="text-bone-white/70 font-mono">
                Benefit from our &quot;Buy via SME Partner&quot; feature, which drives qualified,
                health-conscious customers directly to your product pages with a trusted referral
                pathway.
              </p>
            </div>
          </div>

          {/* Certification Process Overview */}
          <div className="mb-8 border border-translucent-emerald bg-forest-obsidian p-6">
            <h3 className="mb-4 font-serif text-xl font-semibold text-bone-white">
              The Certification Process
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center border border-heart-green bg-heart-green text-sm font-semibold text-forest-obsidian font-mono">
                  1
                </div>
                <p className="text-bone-white/80 font-mono">
                  <strong className="text-bone-white">Initial Review:</strong> We review your existing COA documents and
                  product information to assess alignment with our 5-Pillar Framework.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center border border-heart-green bg-heart-green text-sm font-semibold text-forest-obsidian font-mono">
                  2
                </div>
                <p className="text-bone-white/80 font-mono">
                  <strong className="text-bone-white">Verification:</strong> Our team verifies compliance with each pillar,
                  cross-referencing COA documents, verifying lab credentials, and ensuring test
                  results align with product claims.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center border border-heart-green bg-heart-green text-sm font-semibold text-forest-obsidian font-mono">
                  3
                </div>
                <p className="text-bone-white/80 font-mono">
                  <strong className="text-bone-white">Certification:</strong> Upon successful verification of all five pillars,
                  your product receives the &quot;SME Certified&quot; badge and is featured prominently on
                  our platform.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button
                variant="primary"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold border border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider"
              >
                Contact for Certification
                <ArrowRight size={20} />
              </Button>
            </Link>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // Placeholder for PDF download - can be updated later with actual PDF link
                alert("PDF download will be available soon. Please contact us for more information.");
              }}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold border border-translucent-emerald bg-muted-moss text-bone-white hover:bg-forest-obsidian hover:border-heart-green font-mono uppercase tracking-wider transition-colors"
            >
              <Download size={20} />
              Download Our Standards PDF
            </a>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border border-translucent-emerald bg-muted-moss p-8">
          <h3 className="mb-4 font-serif text-2xl font-semibold text-bone-white">
            Our Commitment to Scientific Rigor
          </h3>
          <div className="space-y-4 text-bone-white/80 font-mono">
            <p>
              The Certified SME program is built on a foundation of scientific integrity and
              transparency. We don&apos;t accept marketing claims or brand-provided summaries. Instead,
              we require direct access to raw laboratory test results and COA documents from
              independent, accredited third-party laboratories.
            </p>
            <p>
              Each product undergoes a comprehensive review process where our team of experts
              verifies that all five pillars are met. This includes cross-referencing COA documents,
              verifying lab credentials, and ensuring that test results align with product claims.
            </p>
            <p>
              When you see the &quot;SME Certified&quot; badge on a product, you can trust that it has
              undergone this rigorous verification process and meets our highest standards for
              quality, purity, and transparency.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}



