"use client";
import Link from "next/link";
import React from "react";
import { FileText, Star, Check, ArrowRight, BookOpen, Award } from "lucide-react";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function SMECitationsPage() {
    return (
        <main className="min-h-screen bg-forest-obsidian px-6 py-12">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="mb-4 flex items-center justify-center gap-3">
                        <BookOpen className="h-10 w-10 text-heart-green" />
                        <h1 className="font-serif text-5xl font-bold text-bone-white md:text-6xl">
                            SME Citations
                        </h1>
                    </div>
                    <p className="mx-auto max-w-3xl text-xl text-bone-white/70 md:text-2xl font-mono">
                        A curated index of verified, science-backed health and wellness products
                        that meet our rigorous 9-Pillar Analysis standards.
                    </p>
                </div>

                {/* What are SME Citations */}
                <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8">
                    <div className="flex items-start gap-4">
                        <FileText size={40} className="text-heart-green flex-shrink-0" />
                        <div>
                            <h2 className="mb-4 font-serif text-3xl font-bold text-bone-white">
                                What are SME Citations?
                            </h2>
                            <div className="space-y-4 text-bone-white/80 font-mono">
                                <p>
                                    SME Citations is our curated index of health and wellness products that have
                                    been verified through our rigorous certification process. Think of it as a
                                    scientific reference library for health-conscious consumers, researchers, and
                                    practitioners seeking products they can trust.
                                </p>
                                <p>
                                    Unlike traditional product databases that accept any submission, SME Citations
                                    only features products that have undergone our comprehensive 9-Pillar Analysis
                                    and demonstrated compliance with our standards for purity, potency, transparency,
                                    and scientific evidence.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Who Uses SME Citations */}
                <div className="mb-12">
                    <h2 className="mb-8 font-serif text-center text-3xl font-bold text-bone-white">
                        Who Uses SME Citations?
                    </h2>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6">
                            <div className="mb-4 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <Award size={32} className="text-heart-green" />
                                </div>
                            </div>
                            <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white text-center">
                                Researchers & Practitioners
                            </h3>
                            <p className="text-bone-white/70 font-mono text-center">
                                Healthcare professionals and researchers use SME Citations to identify
                                evidence-based products they can confidently recommend to patients and clients.
                            </p>
                        </div>

                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6">
                            <div className="mb-4 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <Check size={32} className="text-heart-green" />
                                </div>
                            </div>
                            <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white text-center">
                                Health-Conscious Consumers
                            </h3>
                            <p className="text-bone-white/70 font-mono text-center">
                                Individuals seeking verified, science-backed products use SME Citations to cut
                                through marketing noise and find products that meet rigorous quality standards.
                            </p>
                        </div>

                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6">
                            <div className="mb-4 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <Star size={32} className="text-heart-green" />
                                </div>
                            </div>
                            <h3 className="mb-3 font-serif text-xl font-semibold text-bone-white text-center">
                                Trusted Voices
                            </h3>
                            <p className="text-bone-white/70 font-mono text-center">
                                Influencers, educators, and health advocates reference SME Citations when
                                creating content and recommendations for their audiences.
                            </p>
                        </div>
                    </div>
                </div>

                {/* What Makes a Product Citation-Worthy */}
                <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8">
                    <h2 className="mb-6 font-serif text-3xl font-bold text-bone-white">
                        What Makes a Product Citation-Worthy?
                    </h2>
                    <p className="mb-6 text-bone-white/80 font-mono">
                        To be featured in SME Citations, a product must demonstrate excellence across our
                        9-Pillar Analysis framework:
                    </p>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { name: "Purity", desc: "Verified absence of contaminants via third-party testing" },
                            { name: "Bioavailability", desc: "Optimized absorption and delivery methods" },
                            { name: "Potency", desc: "Active ingredients match label claims" },
                            { name: "Evidence", desc: "Strong clinical research backing claims" },
                            { name: "Sustainability", desc: "Ethical sourcing and eco-friendly practices" },
                            { name: "Experience", desc: "Positive user feedback and subjective effects" },
                            { name: "Safety", desc: "Comprehensive safety profile and contraindication data" },
                            { name: "Transparency", desc: "Full disclosure of sourcing and testing results" },
                            { name: "Synergy", desc: "Ingredients work together for enhanced efficacy" }
                        ].map((pillar, index) => (
                            <div key={pillar.name} className="border border-translucent-emerald bg-forest-obsidian p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center border border-heart-green bg-heart-green text-sm font-bold text-forest-obsidian font-mono">
                                        {index + 1}
                                    </div>
                                    <h3 className="font-serif text-lg font-semibold text-bone-white">
                                        {pillar.name}
                                    </h3>
                                </div>
                                <p className="text-sm text-bone-white/70 font-mono">
                                    {pillar.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <Link href="/standards" className="text-heart-green hover:text-bone-white font-mono inline-flex items-center gap-2 transition-colors">
                            Learn more about our 9-Pillar Analysis
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Browse Certified Products */}
                <div className="mb-12 border-2 border-sme-gold bg-muted-moss p-8">
                    <div className="text-center">
                        <div className="mb-4 flex items-center justify-center gap-2">
                            <Star className="h-8 w-8 text-sme-gold" />
                            <h2 className="font-serif text-3xl font-bold text-bone-white">
                                Browse SME Certified Products
                            </h2>
                            <Star className="h-8 w-8 text-sme-gold" />
                        </div>
                        <p className="mb-6 text-lg text-bone-white/80 font-mono">
                            Explore our growing database of verified, science-backed health and wellness
                            products that have earned the SME Certified badge.
                        </p>
                        <Link href="/products">
                            <Button
                                variant="primary"
                                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold border-2 border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider"
                            >
                                View Certified Products
                                <ArrowRight size={20} />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* For Brands */}
                <div className="border-2 border-heart-green bg-muted-moss p-8">
                    <h2 className="mb-4 font-serif text-3xl font-bold text-bone-white">
                        Get Your Product Featured in SME Citations
                    </h2>
                    <p className="mb-6 text-lg text-bone-white/80 font-mono">
                        If you manufacture or distribute health and wellness products that meet our rigorous
                        standards, we invite you to apply for SME Certification. Featured products gain
                        priority visibility among researchers, practitioners, and health-conscious consumers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/get-certified">
                            <Button
                                variant="primary"
                                className="inline-flex items-center gap-2 px-6 py-3 font-semibold border-2 border-heart-green bg-heart-green text-forest-obsidian hover:bg-[#2D5F3F] hover:border-[#2D5F3F] font-mono uppercase tracking-wider"
                            >
                                Get Certified
                                <ArrowRight size={18} />
                            </Button>
                        </Link>
                        <Link href="/list-your-product">
                            <Button
                                variant="secondary"
                                className="inline-flex items-center gap-2 px-6 py-3 font-semibold border-2 border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green font-mono uppercase tracking-wider"
                            >
                                List Your Product
                                <ArrowRight size={18} />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
