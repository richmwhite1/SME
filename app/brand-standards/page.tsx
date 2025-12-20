import { Shield, Leaf, Sparkles, Ban } from "lucide-react";

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
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 border-b border-bone-white/20 pb-8 text-center">
          <h1 className="mb-4 font-mono text-4xl font-bold text-bone-white sm:text-5xl">
            THE CONSTITUTION
          </h1>
          <p className="text-lg text-bone-white/70 font-mono sm:text-xl">
            Core axioms that guide the Laboratory
          </p>
        </div>

        {/* Axioms Grid */}
        <div className="space-y-6">
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

        {/* Footer Note */}
        <div className="mt-12 border-t border-bone-white/10 pt-8 text-center">
          <p className="text-sm text-bone-white/50 font-mono">
            These principles inform every decision, product review, and community interaction within
            the Laboratory.
          </p>
        </div>
      </div>
    </main>
  );
}

