import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { ShieldCheck, Star, MessageSquare, Users, ArrowRight } from "lucide-react";

export const metadata = {
    title: "How it Works | SME",
    description: "Learn how the SME reputation system, product reviews, and community discussions work.",
};

export default function HowItWorksPage() {
    return (
        <main className="min-h-[calc(100vh-4rem)] bg-forest-obsidian px-6 py-16 text-bone-white">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-bone-white">
                        How SME Works
                    </h1>
                    <p className="text-xl text-bone-white/80 max-w-2xl mx-auto font-mono">
                        Where evidence meets experience. A merit-based ecosystem where trust is earned, not bought.
                    </p>
                </div>

                {/* Section 1: The Concept */}
                <section className="mb-20 grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <div className="w-16 h-16 bg-sme-gold/20 rounded-2xl flex items-center justify-center mb-6 text-sme-gold">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-3xl font-serif font-semibold mb-4">The SME Standard</h2>
                        <p className="text-bone-white/70 leading-relaxed mb-6 font-mono">
                            SME (Subject Matter Expert) is built on the principle of verifiable truth. Unlike traditional platforms where anyone can claim expertise, our system validates claims through rigorous vetting and community auditing.
                        </p>

                        {/* Visual Diagram - Verification Flow */}
                        <div className="mb-8 rounded-xl overflow-hidden border border-translucent-emerald/30 shadow-lg">
                            <Image
                                src="/brain/52afa08e-2573-45b3-86d9-9dfba300a867/verification_flow_1768278844202.png"
                                alt="SME Verification Flow: From Evidence to Verified Signal"
                                width={600}
                                height={300}
                                className="w-full h-auto"
                            />
                        </div>

                        <ul className="space-y-3 font-mono text-sm text-bone-white/80">
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-sme-gold rounded-full" />
                                Evidence-based product verification
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-sme-gold rounded-full" />
                                Transparent sourcing and auditing
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-sme-gold rounded-full" />
                                Community-led consensus
                            </li>
                        </ul>
                    </div>
                    <div className="bg-muted-moss/30 border border-translucent-emerald rounded-2xl p-8 overflow-hidden">
                        <h3 id="nine-pillars" className="text-2xl font-serif font-semibold mb-4 text-heart-green text-center">The 9-Pillar Framework</h3>
                        <p className="text-sm text-bone-white/70 mb-8 text-center max-w-2xl mx-auto font-mono">
                            Every product is analyzed through our comprehensive 9-pillar framework, ensuring that only the highest quality products rise to the top.
                        </p>

                        {/* Visual Diagram */}
                        <div className="mb-8 flex justify-center">
                            <div className="relative w-full max-w-md rounded-xl overflow-hidden">
                                <Image
                                    src="/brain/52afa08e-2573-45b3-86d9-9dfba300a867/nine_pillar_framework_1768278827493.png"
                                    alt="The 9-Pillar Framework: A comprehensive health product analysis system"
                                    width={600}
                                    height={600}
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>

                        {/* Pillar Details Grid */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🧪</span>
                                    <strong className="text-white font-semibold">Purity</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Absence of heavy metals, contaminants, and adulterants.</p>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">💊</span>
                                    <strong className="text-white font-semibold">Bioavailability</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Absorption efficiency and cellular uptake mechanisms.</p>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">⚡</span>
                                    <strong className="text-white font-semibold">Potency</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Active ingredients match label claims and therapeutic doses.</p>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">📊</span>
                                    <strong className="text-white font-semibold">Evidence</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Clinical research and peer-reviewed studies backing benefits.</p>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🌱</span>
                                    <strong className="text-white font-semibold">Sustainability</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Environmental impact of sourcing, production, and packaging.</p>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✨</span>
                                    <strong className="text-white font-semibold">Experience</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Taste, texture, ease of use, and overall user experience.</p>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🛡️</span>
                                    <strong className="text-white font-semibold">Safety</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Side effects, contraindications, and long-term safety data.</p>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🔍</span>
                                    <strong className="text-white font-semibold">Transparency</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Full disclosure of testing, sourcing, and manufacturing.</p>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-white/5 hover:border-sme-gold/30 transition-colors sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🔗</span>
                                    <strong className="text-white font-semibold">Synergy</strong>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">Ingredient interactions and entourage effect optimization.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 1.5: Signal vs. Noise */}
                <section className="mb-20">
                    <div className="border border-translucent-emerald/30 bg-forest-obsidian/50 rounded-2xl p-8 md:p-12 relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sme-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-serif font-semibold mb-4">Signal vs. Noise</h2>
                                <p className="text-bone-white/80 leading-relaxed font-mono text-sm max-w-3xl mx-auto">
                                    In an era of information overload, SME helps you filter for truth. We use specific terminology to describe the quality of information on our platform.
                                </p>
                            </div>

                            {/* Visual Diagram */}
                            <div className="mb-10 flex justify-center">
                                <div className="relative w-full max-w-2xl rounded-xl overflow-hidden border border-translucent-emerald/50">
                                    <Image
                                        src="/brain/52afa08e-2573-45b3-86d9-9dfba300a867/signal_vs_noise_diagram_1768278815749.png"
                                        alt="Signal vs Noise: How SME filters credible information from misinformation"
                                        width={800}
                                        height={800}
                                        className="w-full h-auto"
                                        priority
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                <div className="bg-forest-obsidian/50 border border-heart-green/30 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-heart-green shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                                        <h3 className="font-serif text-xl font-semibold text-bone-white">Signal</h3>
                                    </div>
                                    <p className="text-sm text-bone-white/70 font-mono leading-relaxed mb-4">
                                        Credible, high-value information validated by scientific evidence and community consensus.
                                    </p>
                                    <div className="space-y-2 text-xs font-mono text-bone-white/60">
                                        <div className="flex items-center gap-2">
                                            <span className="text-heart-green">✓</span>
                                            <span>Peer-reviewed research</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-heart-green">✓</span>
                                            <span>Lab-verified claims</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-heart-green">✓</span>
                                            <span>Community-validated experiences</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-heart-green">✓</span>
                                            <span>Transparent sourcing</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-forest-obsidian/50 border border-red-500/30 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                        <h3 className="font-serif text-xl font-semibold text-bone-white">Noise</h3>
                                    </div>
                                    <p className="text-sm text-bone-white/70 font-mono leading-relaxed mb-4">
                                        Misinformation, marketing fluff, and unverified claims that obscure the truth.
                                    </p>
                                    <div className="space-y-2 text-xs font-mono text-bone-white/60">
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500/70">✗</span>
                                            <span>Unsubstantiated marketing claims</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500/70">✗</span>
                                            <span>Anecdotal evidence without context</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500/70">✗</span>
                                            <span>Biased or paid testimonials</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500/70">✗</span>
                                            <span>Misleading ingredient lists</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-sm font-mono text-sme-gold/80 italic">
                                    When you see &quot;Strong Signal&quot; on a product, it means both the data and the community agree on its efficacy.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Reputation System */}
                <section className="mb-20">
                    <div className="bg-gradient-to-br from-muted-moss to-forest-obsidian border border-translucent-emerald rounded-3xl p-8 md:p-12">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <div className="w-16 h-16 bg-heart-green/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-heart-green">
                                <Users size={32} />
                            </div>
                            <h2 className="text-3xl font-serif font-semibold mb-4">Reputation is Currency</h2>
                            <p className="text-bone-white/70 font-mono">
                                Your standing in the community is determined by the quality of your contributions. Earn Reputation Points (RP) by adding value.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: <Star className="text-sme-gold" />,
                                    title: "Product Reviews",
                                    desc: "Write detailed, evidence-backed reviews for products you've tested."
                                },
                                {
                                    icon: <MessageSquare className="text-sme-gold" />,
                                    title: "Discussions",
                                    desc: "Participate in high-level debates and share your expertise."
                                },
                                {
                                    icon: <ShieldCheck className="text-sme-gold" />,
                                    title: "Verification",
                                    desc: "Help audit product claims and verify ingredient sources."
                                }
                            ].map((item, i) => (
                                <div key={i} className="bg-forest-obsidian/50 p-6 rounded-xl border border-translucent-emerald/30">
                                    <div className="mb-4">{item.icon}</div>
                                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                    <p className="text-sm text-bone-white/60 font-mono">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 3: Getting Started Steps */}
                <section className="mb-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-serif font-semibold mb-12 text-center">Get Started in 3 Steps</h2>
                    <div className="space-y-8">
                        {[
                            { step: "01", title: "Explore the Directory", desc: "Browse our curated list of vetted products. Filter by your specific needs and see how they score on the Lens of Truth." },
                            { step: "02", title: "Join the Conversation", desc: "Dive into discussions. Ask questions, challenge assumptions, and learn from other experts in the field." },
                            { step: "03", title: "Contribute Your Wisdom", desc: "Share your experience or clinical evidence. Add to the collective truth and build your reputation as a trusted voice in the community." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-6 items-start md:items-center group">
                                <div className="text-4xl md:text-5xl font-bold text-translucent-emerald/20 font-serif group-hover:text-sme-gold/20 transition-colors">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                    <p className="text-bone-white/60 font-mono">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Footer */}
                <div className="text-center py-12 border-t border-translucent-emerald/30">
                    <h2 className="text-2xl font-serif font-semibold mb-6">Ready to join the movement?</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/products/submit">
                            <Button variant="primary" className="border border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] px-8 py-3 uppercase tracking-wider font-mono">
                                Submit a Product
                            </Button>
                        </Link>
                        <Link href="/products">
                            <Button variant="outline" className="border border-translucent-emerald bg-transparent text-bone-white hover:bg-muted-moss px-8 py-3 uppercase tracking-wider font-mono">
                                Browse Directory
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
