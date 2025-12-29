import { Shield, Leaf, Sparkles, Ban, Check, X, Minus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function BrandStandardsPage() {
  const axioms = [
    {
      title: "Sovereignty",
      icon: Shield,
      description:
        "Individual autonomy and self-determination in health decisions. We respect each person's right to choose their own path to wellness, free from coercion or manipulation.",
    },
    {
      title: "Health through Nature",
      icon: Leaf,
      description:
        "The most effective healing comes from natural sources, properly understood and respectfully utilized. We prioritize plant-based, time-tested solutions over synthetic interventions.",
    },
    {
      title: "Evolving from Animal to Spiritual Nature",
      icon: Sparkles,
      description:
        "Humanity's journey is one of conscious evolution—moving beyond base instincts toward higher awareness, compassion, and spiritual understanding. Our products and practices support this transformation.",
    },
    {
      title: "Rooting out Megalomania",
      icon: Ban,
      description:
        "We reject grandiosity, false claims, and the exploitation of health-seeking individuals. Transparency, humility, and scientific rigor guide all our decisions and recommendations.",
    },
  ];

  return (
    <main className="min-h-screen bg-forest-obsidian px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 border-b border-bone-white/20 pb-8 text-center">
          <h1 className="mb-4 font-mono text-4xl font-bold text-bone-white sm:text-5xl">
            THE CONSTITUTION
          </h1>
          <p className="text-lg text-bone-white/70 font-mono sm:text-xl">
            Core axioms that guide the Community
          </p>
        </div>

        {/* Axioms Grid */}
        <div className="mb-24 space-y-6">
          {axioms.map((axiom, index) => {
            const Icon = axiom.icon;
            return (
              <div
                key={axiom.title}
                className="border border-bone-white/20 bg-bone-white/5 p-6 sm:p-8 font-mono"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-sme-gold bg-sme-gold/10">
                    <Icon className="h-6 w-6 text-sme-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-xs text-sme-gold uppercase tracking-wider">
                        Axiom {index + 1}
                      </span>
                      <h2 className="text-xl font-bold text-bone-white sm:text-2xl">
                        {axiom.title}
                      </h2>
                    </div>
                    <p className="text-sm leading-relaxed text-bone-white/80 sm:text-base">
                      {axiom.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Partner with the Community Section */}
        <div className="mb-24">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-mono text-3xl font-bold text-bone-white sm:text-4xl">
              Partner with the Community
            </h2>
            <p className="text-lg text-bone-white/70 font-mono">
              Choose your level of engagement and verification
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-bone-white/20 bg-bone-white/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-bone-white/20 bg-bone-white/5">
                    <th className="p-6 text-bone-white">Feature</th>
                    <th className="p-6 text-center text-bone-white">
                      <div className="text-lg font-bold">Community</div>
                      <div className="text-xs text-bone-white/50">(Unverified)</div>
                    </th>
                    <th className="p-6 text-center text-bone-white">
                      <div className="text-lg font-bold text-sme-gold">Managed</div>
                      <div className="text-xs text-sme-gold/70">(Verified)</div>
                    </th>
                    <th className="p-6 text-center text-bone-white">
                      <div className="text-lg font-bold text-emerald-400">SME Certified</div>
                      <div className="text-xs text-emerald-400/70">(The Gold Standard)</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bone-white/10">
                  {/* Cost */}
                  <tr>
                    <td className="p-6 font-bold text-bone-white">Cost</td>
                    <td className="p-6 text-center text-bone-white/70">Free</td>
                    <td className="p-6 text-center text-bone-white/70">$100/mo <br /><span className="text-xs">(or $0.01/visit)</span></td>
                    <td className="p-6 text-center text-bone-white/70">Managed + <br />$3,000 (One-time)</td>
                  </tr>

                  {/* Brand Identity */}
                  <tr>
                    <td className="p-6 font-bold text-bone-white">Brand Identity</td>
                    <td className="p-6 text-center text-bone-white/70">Standard Profile</td>
                    <td className="p-6 text-center text-bone-white/70">Official Brand Badge</td>
                    <td className="p-6 text-center text-bone-white/70">SME Certified Seal</td>
                  </tr>

                  {/* Engagement */}
                  <tr>
                    <td className="p-6 font-bold text-bone-white">Engagement</td>
                    <td className="p-6 text-center text-bone-white/70">Read-Only</td>
                    <td className="p-6 text-center text-bone-white/70">Official Responses</td>
                    <td className="p-6 text-center text-bone-white/70">Priority Feed Status</td>
                  </tr>

                  {/* Commerce */}
                  <tr>
                    <td className="p-6 font-bold text-bone-white">Commerce</td>
                    <td className="p-6 text-center text-bone-white/70">None</td>
                    <td className="p-6 text-center text-bone-white/70">"Buy Now" & Promo Codes</td>
                    <td className="p-6 text-center text-bone-white/70">Truth Signal Validation</td>
                  </tr>

                  {/* Status */}
                  <tr>
                    <td className="p-6 font-bold text-bone-white">Status</td>
                    <td className="p-6 text-center text-bone-white/70">
                      <span className="inline-flex items-center gap-2 rounded-full border border-bone-white/20 px-3 py-1 text-xs">
                        <Minus className="h-3 w-3" /> Unverified
                      </span>
                    </td>
                    <td className="p-6 text-center text-bone-white/70">
                      <span className="inline-flex items-center gap-2 rounded-full border border-sme-gold/30 bg-sme-gold/10 px-3 py-1 text-xs text-sme-gold">
                        <Check className="h-3 w-3" /> Verified Ownership
                      </span>
                    </td>
                    <td className="p-6 text-center text-bone-white/70">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                        <Shield className="h-3 w-3" /> Full Scientific Audit
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Understanding Verification vs. Certification */}
        <div className="mb-24 font-mono">
          <div className="mb-8 border-l-4 border-sme-gold pl-6">
            <h2 className="text-2xl font-bold text-bone-white mb-2">
              Understanding Verification vs. Certification
            </h2>
            <p className="text-bone-white/60">
              Your path to building trust within the community.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-lg bg-bone-white/5 p-6">
              <h3 className="mb-3 text-lg font-bold text-bone-white">Unverified</h3>
              <p className="text-sm text-bone-white/70 leading-relaxed">
                Default state for products ingested by the community. Data is crowdsourced and not yet audited. Users discuss these products, but the brand has no official voice.
              </p>
            </div>

            <div className="rounded-lg bg-sme-gold/5 p-6 border border-sme-gold/20">
              <h3 className="mb-3 text-lg font-bold text-sme-gold">Verified (Ownership)</h3>
              <p className="text-sm text-bone-white/70 leading-relaxed">
                A brand has claimed their page, verified their identity (via work email/LinkedIn), and is paying to manage their presence and respond to users.
              </p>
            </div>

            <div className="rounded-lg bg-emerald-900/10 p-6 border border-emerald-500/20">
              <h3 className="mb-3 text-lg font-bold text-emerald-400">SME Certified (Evidence)</h3>
              <p className="text-sm text-bone-white/70 leading-relaxed">
                The "Gold Standard." A brand has paid for a one-time intensive audit by our SMEs. All claims, COAs, and lab reports have been scientifically validated.
              </p>
            </div>
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="text-center pb-12">
          <Link
            href="/business-intake"
            className="inline-flex items-center justify-center rounded-full bg-sme-gold px-8 py-4 font-mono text-lg font-bold text-black transition-transform hover:scale-105 hover:bg-sme-gold/90 focus:outline-none focus:ring-2 focus:ring-sme-gold focus:ring-offset-2 focus:ring-offset-black"
          >
            Apply for Brand Verification
          </Link>
          <p className="mt-4 text-sm text-bone-white/50 font-mono">
            Requires work email & LinkedIn profile for identity verification
          </p>
        </div>

        {/* Footer Note */}
        <div className="border-t border-bone-white/10 pt-8 text-center">
          <p className="text-sm text-bone-white/50 font-mono">
            These principles inform every decision, product review, and community interaction within
            the Community.
          </p>
        </div>
      </div>
    </main>
  );
}
