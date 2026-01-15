import { AlertTriangle, FileText, Heart } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center border border-heart-green bg-heart-green/20">
              <AlertTriangle size={32} className="text-heart-green" />
            </div>
          </div>
          <h1 className="mb-4 font-serif text-4xl font-bold text-bone-white md:text-5xl">
            Medical Disclaimer
          </h1>
          <p className="text-xl text-bone-white/70 font-mono">
            Important information about the nature of our platform
          </p>
        </div>

        {/* Main Disclaimer Statement */}
        <div className="mb-8 border-2 border-translucent-emerald bg-muted-moss p-10">
          <div className="mb-6 text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold text-bone-white">
              Not Medical Advice
            </h2>
          </div>

          <div className="space-y-6 text-bone-white/90 leading-relaxed font-mono">
            <p className="text-lg font-medium">
              The information, content, and materials provided on SME (Subject Matter Experts)
              are <strong className="text-bone-white">for informational and educational purposes only</strong>
              and are not intended to be a substitute for professional medical advice, diagnosis, or treatment.
            </p>

            <div className="border-l-4 border-heart-green bg-heart-green/10 p-4">
              <p className="font-semibold text-heart-green font-mono">
                Always seek the advice of your physician or other qualified health provider
                with any questions you may have regarding a medical condition or health objectives.
              </p>
            </div>

            <p>
              Never disregard professional medical advice or delay in seeking it because of
              something you have read, seen, or heard on this platform.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          {/* What We Are */}
          <div className="border border-translucent-emerald bg-muted-moss p-8">
            <div className="mb-4 flex items-center gap-3">
              <FileText size={24} className="text-heart-green" />
              <h2 className="font-serif text-2xl font-bold text-bone-white">
                What SME Is
              </h2>
            </div>
            <ul className="ml-6 list-disc space-y-2 text-bone-white/80 leading-relaxed font-mono">
              <li>A community-driven platform for sharing experiences and information</li>
              <li>A repository of user reviews, discussions, and evidence-based resources</li>
              <li>A certification system for product transparency and quality verification</li>
              <li>A forum for open dialogue about holistic health and wellness</li>
            </ul>
          </div>

          {/* What We Are Not */}
          <div className="border border-translucent-emerald bg-muted-moss p-8">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle size={24} className="text-heart-green" />
              <h2 className="font-serif text-2xl font-bold text-bone-white">
                What SME Is Not
              </h2>
            </div>
            <ul className="ml-6 list-disc space-y-2 text-bone-white/80 leading-relaxed font-mono">
              <li><strong>Not a medical provider:</strong> We do not diagnose, treat, or cure any medical condition</li>
              <li><strong>Not a replacement for professional care:</strong> Always consult qualified healthcare providers</li>
              <li><strong>Not a guarantee:</strong> Product certifications verify transparency, not therapeutic efficacy</li>
              <li><strong>Not a regulatory body:</strong> We are not FDA, medical board, or government agency</li>
            </ul>
          </div>

          {/* Individual Responsibility */}
          <div className="border border-translucent-emerald bg-muted-moss p-8">
            <div className="mb-4 flex items-center gap-3">
              <Heart size={24} className="text-heart-green" />
              <h2 className="font-serif text-2xl font-bold text-bone-white">
                Your Responsibility
              </h2>
            </div>
            <div className="space-y-4 text-bone-white/80 leading-relaxed font-mono">
              <p>
                When using information from SME:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Consult with qualified healthcare professionals before making health decisions</li>
                <li>Consider your individual health status, allergies, and medical history</li>
                <li>Verify information through multiple credible sources</li>
                <li>Understand that individual results may vary</li>
                <li>Report adverse effects to your healthcare provider and relevant authorities</li>
              </ul>
            </div>
          </div>

          {/* Product Information */}
          <div className="border border-translucent-emerald bg-muted-moss p-8">
            <h2 className="mb-4 font-serif text-2xl font-bold text-bone-white">
              About Product Information
            </h2>
            <div className="space-y-4 text-bone-white/80 leading-relaxed font-mono">
              <p>
                Product reviews, certifications, and discussions on SME reflect community
                experiences and verified transparency standards. They do not constitute:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Medical recommendations or prescriptions</li>
                <li>Endorsements of therapeutic efficacy</li>
                <li>Guarantees of safety or effectiveness</li>
                <li>Substitutes for professional medical evaluation</li>
              </ul>
              <p className="mt-4">
                Our <strong>SME Certified</strong> badge indicates that a product has met our
                9-Pillar Analysis for <strong>transparency and process verification</strong>. It is strictly
                an audit of the manufacturer&apos;s transparency, documentation, and quality control processes.
                <strong>It does NOT guarantee</strong> that the product is safe, effective, free from side effects,
                or appropriate for your specific health needs.
              </p>
            </div>
          </div>

          {/* Emergency Notice */}
          <div className="border-2 border-heart-green bg-heart-green/10 p-6">
            <h2 className="mb-3 font-serif text-xl font-bold text-heart-green">
              Medical Emergency
            </h2>
            <p className="text-heart-green leading-relaxed font-mono">
              If you think you may have a medical emergency, call your doctor or emergency
              services (911 in the United States) immediately. Do not rely on this platform
              for emergency medical situations.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 border border-translucent-emerald bg-muted-moss p-6 text-center">
          <p className="mb-4 text-bone-white/70 font-mono">
            Have questions about this disclaimer?
          </p>
          <Link
            href="/contact"
            className="inline-block border border-sme-gold bg-sme-gold px-6 py-2 text-forest-obsidian transition-colors hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </main>
  );
}




