"use client";
import Link from "next/link";
import React from "react";
import { Package, FileText, Check, ArrowRight, Mail, Upload } from "lucide-react";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function ListYourProductPage() {
    return (
        <main className="min-h-screen bg-forest-obsidian px-6 py-12">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="mb-4 flex items-center justify-center gap-3">
                        <Package className="h-10 w-10 text-heart-green" />
                        <h1 className="font-serif text-5xl font-bold text-bone-white md:text-6xl">
                            List Your Product
                        </h1>
                    </div>
                    <p className="mx-auto max-w-3xl text-xl text-bone-white/70 md:text-2xl font-mono">
                        Get your health and wellness products in front of a community that values
                        transparency, scientific validation, and quality.
                    </p>
                </div>

                {/* Why List on SME */}
                <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8">
                    <h2 className="mb-6 font-serif text-3xl font-bold text-bone-white">
                        Why List on SME?
                    </h2>
                    <div className="space-y-4 text-bone-white/80 font-mono">
                        <p>
                            SME is a trusted platform where health-conscious consumers, researchers, and
                            practitioners discover products that meet rigorous standards for quality,
                            transparency, and scientific validation.
                        </p>
                        <p>
                            By listing your product on SME, you gain access to a community that values
                            evidence-based health solutions and is actively seeking products they can trust.
                        </p>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="mb-12">
                    <h2 className="mb-8 font-serif text-center text-3xl font-bold text-bone-white">
                        Benefits of Listing
                    </h2>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <Check size={24} className="text-heart-green" />
                                </div>
                                <h3 className="font-serif text-xl font-semibold text-bone-white">
                                    Targeted Audience
                                </h3>
                            </div>
                            <p className="text-bone-white/70 font-mono">
                                Reach health-conscious consumers who are actively researching and comparing
                                products based on scientific evidence and quality standards.
                            </p>
                        </div>

                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <FileText size={24} className="text-heart-green" />
                                </div>
                                <h3 className="font-serif text-xl font-semibold text-bone-white">
                                    Community Feedback
                                </h3>
                            </div>
                            <p className="text-bone-white/70 font-mono">
                                Receive valuable feedback from our community of experts and users who provide
                                detailed reviews and insights on product effectiveness.
                            </p>
                        </div>

                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <Upload size={24} className="text-heart-green" />
                                </div>
                                <h3 className="font-serif text-xl font-semibold text-bone-white">
                                    Transparency Showcase
                                </h3>
                            </div>
                            <p className="text-bone-white/70 font-mono">
                                Demonstrate your commitment to transparency by sharing COA documents, ingredient
                                sourcing, and scientific evidence supporting your product claims.
                            </p>
                        </div>

                        <div className="border-2 border-translucent-emerald bg-muted-moss p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center border-2 border-heart-green bg-forest-obsidian">
                                    <ArrowRight size={24} className="text-heart-green" />
                                </div>
                                <h3 className="font-serif text-xl font-semibold text-bone-white">
                                    Direct Sales Channel
                                </h3>
                            </div>
                            <p className="text-bone-white/70 font-mono">
                                Drive qualified traffic directly to your product pages through our &quot;Buy via
                                SME Partner&quot; feature, connecting you with ready-to-purchase customers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Listing Options */}
                <div className="mb-12 border-2 border-translucent-emerald bg-muted-moss p-8">
                    <h2 className="mb-6 font-serif text-3xl font-bold text-bone-white">
                        Listing Options
                    </h2>

                    <div className="space-y-6">
                        {/* Standard Listing */}
                        <div className="border border-translucent-emerald bg-forest-obsidian p-6">
                            <h3 className="mb-3 font-serif text-2xl font-semibold text-bone-white">
                                Standard Listing
                            </h3>
                            <p className="mb-4 text-bone-white/80 font-mono">
                                Get your product listed in our database where it can be discovered, reviewed,
                                and discussed by our community. Standard listings include:
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "Product profile page with images and descriptions",
                                    "Community reviews and ratings",
                                    "Discussion threads for user feedback",
                                    "Basic product information and specifications"
                                ].map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-bone-white/80 font-mono">
                                        <Check size={20} className="mt-0.5 flex-shrink-0 text-heart-green" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* SME Certified Listing */}
                        <div className="border-2 border-sme-gold bg-forest-obsidian p-6">
                            <div className="mb-3 flex items-center gap-2">
                                <h3 className="font-serif text-2xl font-semibold text-bone-white">
                                    SME Certified Listing
                                </h3>
                                <span className="px-3 py-1 border border-sme-gold bg-sme-gold text-forest-obsidian text-sm font-bold font-mono uppercase">
                                    Premium
                                </span>
                            </div>
                            <p className="mb-4 text-bone-white/80 font-mono">
                                Earn the SME Certified badge through our rigorous 9-Pillar Analysis. Certified
                                listings receive:
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "All Standard Listing features",
                                    "SME Certified badge and priority placement",
                                    "Featured in SME Citations for researchers",
                                    "Trusted Voice visibility and recommendations",
                                    "Enhanced product analytics and insights",
                                    "Direct-to-site traffic funneling"
                                ].map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-bone-white/80 font-mono">
                                        <Check size={20} className="mt-0.5 flex-shrink-0 text-sme-gold" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4">
                                <Link href="/get-certified" className="text-sme-gold hover:text-bone-white font-mono inline-flex items-center gap-2 transition-colors">
                                    Learn about certification
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="border-2 border-heart-green bg-muted-moss p-8 text-center">
                    <h2 className="mb-4 font-serif text-3xl font-bold text-bone-white">
                        Ready to List Your Product?
                    </h2>
                    <p className="mb-6 text-lg text-bone-white/80 font-mono">
                        Contact us to get started with listing your products on SME.
                    </p>
                    <Link href="/contact">
                        <Button
                            variant="primary"
                            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold border-2 border-heart-green bg-heart-green text-forest-obsidian hover:bg-[#2D5F3F] hover:border-[#2D5F3F] font-mono uppercase tracking-wider"
                        >
                            <Mail size={20} />
                            Contact Us to List Your Product
                            <ArrowRight size={20} />
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
