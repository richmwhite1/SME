import Link from "next/link";
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
                        A merit-based ecosystem where trust is earned, not bought.
                    </p>
                </div>

                {/* Section 1: The Concept */}
                <section className="mb-20 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="w-16 h-16 bg-sme-gold/20 rounded-2xl flex items-center justify-center mb-6 text-sme-gold">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-3xl font-serif font-semibold mb-4">The SME Standard</h2>
                        <p className="text-bone-white/70 leading-relaxed mb-6 font-mono">
                            SME (Subject Matter Expert) is built on the principle of verifiable truth. Unlike traditional platforms where anyone can claim expertise, our system validates claims through rigorous vetting and community auditing.
                        </p>
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
                    <div className="bg-muted-moss/30 border border-translucent-emerald rounded-2xl p-8">
                        <h3 className="text-xl font-semibold mb-4 text-heart-green">The Lens of Truth</h3>
                        <p className="text-sm text-bone-white/60 mb-6">
                            Every product is analyzed through our 9-pillar framework, ensuring that only the highest quality products rise to the top.
                        </p>
                        {/* Visual representation placeholder */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-translucent-emerald/40 text-center">
                                <span className="block text-2xl font-bold text-sme-gold mb-1">9</span>
                                <span className="text-xs uppercase tracking-wider text-bone-white/50">Pillars</span>
                            </div>
                            <div className="bg-forest-obsidian p-4 rounded-lg border border-translucent-emerald/40 text-center">
                                <span className="block text-2xl font-bold text-sme-gold mb-1">100%</span>
                                <span className="text-xs uppercase tracking-wider text-bone-white/50">Transparency</span>
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
                            { step: "03", title: "Contribute & Earn", desc: "Submit a product or write your first review. Start building your reputation as a trusted voice in the community." }
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
