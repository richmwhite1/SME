"use client";
import Link from "next/link";
import React from "react";
import { Check, FileText, Shield, Star, ArrowRight, Mail } from "lucide-react";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function GetCertifiedPage() {
    return (
        <main className="min-h-screen bg-forest-obsidian px-6 py-12">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="mb-4 flex items-center justify-center gap-2">
                        <Star className="h-10 w-10 text-sme-gold" />
                        <h1 className="font-serif text-5xl font-bold text-bone-white md:text-6xl">
                            Get SME Certified
                        </h1>
                        <Star className="h-10 w-10 text-sme-gold" />
                    </div>
                    <p className="mx-auto max-w-3xl text-xl text-bone-white/70 md:text-2xl font-mono">
                        Join trusted brands that prioritize transparency and scientific validation.
                        Earn the SME Certified badge and gain visibility among health-conscious consumers.
                    </p>
                </div>

                {/* Why Get Certified */}
                <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8">
                    <h2 className="mb-6 font-serif text-3xl font-bold text-bone-white">
                        Why Get SME Certified?
                    </h2>
                    <div className="space-y-4 text-bone-white/80 font-mono">
                        <p>
                            The SME Certification Program offers a rigorous, science-backed pathway to
                            demonstrate your commitment to quality and transparency. Unlike other certification
                            programs that rely on brand summaries or marketing materials, we require and verify{" "}
                            <strong className="text-bone-white">raw Certificate of Analysis (COA) documents</strong>{" "}
                            directly from independent third-party laboratories.
                        </p>
                        <p>
                            When your product earns the &quot;SME Certified&quot; badge, it signals to health-conscious
                            consumers, researchers, and practitioners that your product has undergone our rigorous
                            9-Pillar Analysis and meets our highest standards for quality, purity, and transparency.
                        </p>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="mb-12">
                    <h2 className="mb-8 font-serif text-center text-3xl font-bold text-bone-white">
                        Certification Benefits
                    </h2>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6 transition-all hover:border-heart-green">
                            <div className="mb-4 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <FileText size={32} className="text-heart-green" />
                                </div>
                            </div>
                            <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white text-center">
                                Priority Indexing
                            </h3>
                            <p className="text-bone-white/70 font-mono text-center">
                                Your products are featured prominently in our SME Citations, making them easily
                                discoverable by researchers and health-conscious consumers.
                            </p>
                        </div>

                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6 transition-all hover:border-heart-green">
                            <div className="mb-4 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <Shield size={32} className="text-heart-green" />
                                </div>
                            </div>
                            <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white text-center">
                                Trusted Voice Visibility
                            </h3>
                            <p className="text-bone-white/70 font-mono text-center">
                                Gain visibility within our community of Trusted Voices—experts, researchers, and
                                practitioners who value verified, science-backed products.
                            </p>
                        </div>

                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6 transition-all hover:border-heart-green">
                            <div className="mb-4 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <ArrowRight size={32} className="text-heart-green" />
                                </div>
                            </div>
                            <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white text-center">
                                Direct-to-Site Funneling
                            </h3>
                            <p className="text-bone-white/70 font-mono text-center">
                                Benefit from our &quot;Buy via SME Partner&quot; feature, which drives qualified,
                                health-conscious customers directly to your product pages.
                            </p>
                        </div>
                    </div>
                </div>

                {/* The 9-Pillar Analysis */}
                <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8">
                    <h2 className="mb-6 font-serif text-3xl font-bold text-bone-white">
                        The 9-Pillar Analysis
                    </h2>
                    <p className="mb-6 text-bone-white/80 font-mono">
                        Every certified product undergoes a comprehensive evaluation across nine critical dimensions:
                    </p>
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            "Purity",
                            "Bioavailability",
                            "Potency",
                            "Evidence",
                            "Sustainability",
                            "Experience",
                            "Safety",
                            "Transparency",
                            "Synergy"
                        ].map((pillar, index) => (
                            <div key={pillar} className="flex items-center gap-2">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center border border-heart-green bg-heart-green text-sm font-bold text-forest-obsidian font-mono">
                                    {index + 1}
                                </div>
                                <span className="text-bone-white font-mono font-semibold">{pillar}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <Link href="/standards" className="text-heart-green hover:text-bone-white font-mono inline-flex items-center gap-2 transition-colors">
                            Learn more about our standards
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Certification Process */}
                <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8">
                    <h2 className="mb-6 font-serif text-3xl font-bold text-bone-white">
                        The Certification Process
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-heart-green bg-heart-green text-lg font-bold text-forest-obsidian font-mono">
                                1
                            </div>
                            <div>
                                <h3 className="mb-2 font-serif text-lg font-semibold text-bone-white">
                                    Initial Review
                                </h3>
                                <p className="text-bone-white/80 font-mono">
                                    We review your existing COA documents and product information to assess alignment
                                    with our 9-Pillar Analysis.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-heart-green bg-heart-green text-lg font-bold text-forest-obsidian font-mono">
                                2
                            </div>
                            <div>
                                <h3 className="mb-2 font-serif text-lg font-semibold text-bone-white">
                                    Verification
                                </h3>
                                <p className="text-bone-white/80 font-mono">
                                    Our team verifies compliance with each pillar, cross-referencing COA documents,
                                    verifying lab credentials, and ensuring test results align with product claims.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-heart-green bg-heart-green text-lg font-bold text-forest-obsidian font-mono">
                                3
                            </div>
                            <div>
                                <h3 className="mb-2 font-serif text-lg font-semibold text-bone-white">
                                    Certification
                                </h3>
                                <p className="text-bone-white/80 font-mono">
                                    Upon successful verification of the core pillars, your product receives the
                                    &quot;SME Certified&quot; badge and is featured prominently on our platform.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="border-2 border-sme-gold bg-muted-moss p-8 text-center">
                    <h2 className="mb-4 font-serif text-3xl font-bold text-bone-white">
                        Ready to Get Certified?
                    </h2>
                    <p className="mb-6 text-lg text-bone-white/80 font-mono">
                        Contact us to begin the certification process for your products.
                    </p>
                    <Link href="/contact">
                        <Button
                            variant="primary"
                            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold border-2 border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider"
                        >
                            <Mail size={20} />
                            Contact Us for Certification
                            <ArrowRight size={20} />
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
