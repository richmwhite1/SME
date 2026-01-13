import { FileText, Scale, Eye } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-serif text-4xl font-bold text-bone-white md:text-5xl">
            Terms of Service
          </h1>
          <p className="text-xl text-bone-white/70 font-mono">
            Our commitment to transparency and community-driven integrity
          </p>
        </div>

        {/* Court of Public Opinion Section */}
        <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-translucent-emerald bg-forest-obsidian">
              <Scale size={24} className="text-heart-green" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-bone-white">
              The Court of Public Opinion
            </h2>
          </div>

          <div className="space-y-4 text-bone-white/80 leading-relaxed font-mono">
            <p className="text-lg">
              SME operates on a fundamental principle: <strong className="text-bone-white">the community is the ultimate judge</strong>.
              We believe that collective wisdom, when properly channeled, creates a more reliable standard
              than any single authority or institution.
            </p>

            <p>
              Our platform serves as a transparent forum where products, protocols, and discussions are
              evaluated by the community through:
            </p>

            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Community Reviews:</strong> Real experiences from verified users who have actually used the products</li>
              <li><strong>Trusted Voice Contributions:</strong> Evidence-based insights from credentialed experts</li>
              <li><strong>Open Discussion:</strong> Transparent conversations where claims can be challenged and verified</li>
              <li><strong>Collective Verification:</strong> Multiple perspectives converging on truth</li>
            </ul>

            <p>
              By participating in SME, you acknowledge that the &quot;Court of Public Opinion&quot; is our primary
              mechanism for establishing credibility. Products and claims are evaluated not by a hidden
              committee, but by the visible, traceable contributions of our community.
            </p>

            <div className="mt-6 border border-translucent-emerald bg-forest-obsidian p-4">
              <p className="text-sm italic text-bone-white/70 font-mono">
                &quot;In the absence of perfect information, the collective judgment of informed participants
                becomes our most reliable compass.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Transparency Standards Section */}
        <div className="mb-12 border border-translucent-emerald bg-muted-moss p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-translucent-emerald bg-forest-obsidian">
              <Eye size={24} className="text-heart-green" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-bone-white">
              Transparency Standards
            </h2>
          </div>

          <div className="space-y-6 text-bone-white/80 leading-relaxed font-mono">
            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white">
                What We Require
              </h3>
              <ul className="ml-6 list-disc space-y-2">
                <li><strong>Source Disclosure:</strong> All claims must be traceable to verifiable sources</li>
                <li><strong>Evidence-Based Content:</strong> Discussions and reviews should reference actual experiences or scientific evidence</li>
                <li><strong>Conflict Transparency:</strong> Users must disclose any financial or material relationships with products they discuss</li>
                <li><strong>Raw Data Access:</strong> Certified products must provide raw COA documents, not marketing summaries</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white">
                What We Prohibit
              </h3>
              <ul className="ml-6 list-disc space-y-2">
                <li>Misleading or unsubstantiated health claims</li>
                <li>Undisclosed promotional content or paid endorsements</li>
                <li>Manipulation of reviews, votes, or community signals</li>
                <li>Spam, harassment, or content that violates community standards</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white">
                Our Commitment to You
              </h3>
              <p>
                We commit to maintaining transparency in our own operations:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-2">
                <li>All certification decisions are based on verifiable 9-Pillar Analysis criteria</li>
                <li>Community moderation actions are logged and can be reviewed</li>
                <li>Our algorithms and ranking systems are explained, not hidden</li>
                <li>We disclose any partnerships or financial relationships that might influence our platform</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Standard Terms Section */}
        <div className="mb-12 border border-translucent-emerald bg-muted-moss p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-translucent-emerald bg-forest-obsidian">
              <FileText size={24} className="text-heart-green" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-bone-white">
              Standard Terms
            </h2>
          </div>

          <div className="space-y-6 text-bone-white/80 leading-relaxed font-mono">
            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white">
                User Responsibilities
              </h3>
              <p>
                By using SME, you agree to:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-2">
                <li>Provide accurate information in your profile and contributions</li>
                <li>Respect intellectual property rights of others</li>
                <li>Not use the platform for illegal activities</li>
                <li>Accept that your contributions may be reviewed and moderated by the community</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white">
                Platform Limitations
              </h3>
              <p>
                SME is a community platform, not a medical authority. We do not:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-2">
                <li>Provide medical advice or diagnosis</li>
                <li>Guarantee the accuracy of all user-contributed content</li>
                <li>Endorse any specific products or protocols</li>
                <li>Replace professional medical consultation</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white">
                Content Ownership
              </h3>
              <p>
                You retain ownership of content you post, but grant SME a license to display,
                distribute, and modify your content for platform purposes. You may delete your
                content at any time, subject to technical limitations.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white">
                Modifications to Terms
              </h3>
              <p>
                We may update these terms periodically. Continued use of the platform after
                changes constitutes acceptance of the new terms. We will notify users of
                significant changes.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border border-translucent-emerald bg-muted-moss p-6 text-center">
          <p className="mb-4 text-bone-white/70 font-mono">
            Questions about these terms?
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




