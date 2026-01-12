import { Metadata } from "next";
import Link from "next/link";
import { Heart, MessageCircle, BookOpen, Shield, CheckCircle, XCircle, Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "Community Guidelines | Expected Behavior & Standards",
    description: "Our community guidelines for respectful behavior, quality contributions, and maintaining a constructive, evidence-based platform.",
};

export default function CommunityGuidelinesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center">
                        <Heart className="w-16 h-16 mx-auto mb-6 opacity-90" />
                        <h1 className="text-5xl font-bold mb-6">Community Guidelines</h1>
                        <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed">
                            Our shared values, expected behavior, and contribution standards
                            for maintaining a constructive, evidence-based community
                        </p>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-16 max-w-6xl mx-auto px-4">
                <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                    Our Core Values
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: BookOpen,
                            title: "Evidence-Based",
                            description: "We prioritize scientific research, peer-reviewed studies, and verifiable data over anecdotes and marketing claims."
                        },
                        {
                            icon: Heart,
                            title: "Respectful",
                            description: "We treat all members with respect, even when we disagree. Personal attacks and harassment have no place here."
                        },
                        {
                            icon: Sparkles,
                            title: "Helpful",
                            description: "We aim to help others on their health journey by sharing knowledge, experiences, and constructive feedback."
                        }
                    ].map((value, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <value.icon className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                {value.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                {value.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Expected Behavior */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                        Expected Behavior
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center gap-3">
                                <CheckCircle className="w-8 h-8" />
                                Do This
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    "Cite your sources when making claims",
                                    "Share personal experiences with context",
                                    "Ask clarifying questions respectfully",
                                    "Acknowledge when you're uncertain",
                                    "Provide constructive feedback",
                                    "Welcome diverse perspectives",
                                    "Report violations of guidelines",
                                    "Assume good intentions"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                        <span className="text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h3 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-3">
                                <XCircle className="w-8 h-8" />
                                Don't Do This
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    "Make unsubstantiated health claims",
                                    "Provide dangerous medical advice",
                                    "Attack or harass other members",
                                    "Spam promotional content",
                                    "Share personal information",
                                    "Spread misinformation",
                                    "Engage in off-topic arguments",
                                    "Manipulate votes or reputation"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                                        <span className="text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contribution Quality Standards */}
            <section className="py-16 max-w-6xl mx-auto px-4">
                <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                    Contribution Quality Standards
                </h2>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-10 border border-blue-200 mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">
                        Scientific Citations
                    </h3>
                    <p className="text-lg text-slate-700 mb-6">
                        When making health or scientific claims, please provide citations to support your statements:
                    </p>
                    <ul className="space-y-3">
                        {[
                            "Link to peer-reviewed studies (PubMed, Google Scholar, etc.)",
                            "Reference specific research papers with authors and publication dates",
                            "Cite reputable health organizations (NIH, WHO, Mayo Clinic, etc.)",
                            "Distinguish between correlation and causation",
                            "Acknowledge limitations of studies you cite"
                        ].map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                <span className="text-slate-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-200">
                        <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" />
                            Good Example
                        </h3>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-slate-700 italic mb-3">
                                "Magnesium glycinate has been shown to improve sleep quality in several studies.
                                A 2012 randomized controlled trial found that 500mg daily improved subjective sleep
                                quality in elderly participants (Abbasi et al., 2012). However, results may vary
                                based on individual magnesium status."
                            </p>
                            <p className="text-sm text-green-700 font-medium">
                                ✓ Cites specific study<br />
                                ✓ Provides dosage and population<br />
                                ✓ Acknowledges limitations
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200">
                        <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                            <XCircle className="w-6 h-6" />
                            Bad Example
                        </h3>
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <p className="text-slate-700 italic mb-3">
                                "Magnesium cures insomnia! I read somewhere that everyone should take it.
                                It's completely safe and has no side effects. Big Pharma doesn't want you
                                to know about this!"
                            </p>
                            <p className="text-sm text-red-700 font-medium">
                                ✗ No citations<br />
                                ✗ Absolute claims<br />
                                ✗ Conspiracy theory language
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Consequences */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                        Consequences for Violations
                    </h2>

                    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                        <p className="text-lg text-slate-700 mb-8">
                            We take a progressive approach to enforcement, with consequences escalating
                            based on severity and frequency of violations:
                        </p>

                        <div className="space-y-6">
                            {[
                                {
                                    level: "1st Violation",
                                    action: "Warning",
                                    description: "Content may be flagged or removed. User receives a warning message explaining the violation."
                                },
                                {
                                    level: "2nd Violation",
                                    action: "Temporary Restriction",
                                    description: "Posting privileges suspended for 7 days. Reputation points may be deducted."
                                },
                                {
                                    level: "3rd Violation",
                                    action: "Extended Suspension",
                                    description: "Account suspended for 30 days. Loss of SME status if applicable."
                                },
                                {
                                    level: "Severe/Repeated",
                                    action: "Permanent Ban",
                                    description: "Account permanently banned for egregious violations or repeated offenses after warnings."
                                }
                            ].map((consequence, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div className="flex-shrink-0 w-32">
                                        <div className="font-bold text-slate-900">{consequence.level}</div>
                                        <div className="text-sm text-red-600 font-medium">{consequence.action}</div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-700">{consequence.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Reporting */}
            <section className="py-16 max-w-6xl mx-auto px-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-10 border border-purple-200">
                    <div className="text-center mb-8">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Reporting Violations
                        </h2>
                        <p className="text-lg text-slate-700 max-w-2xl mx-auto">
                            Help us maintain a healthy community by reporting content that violates these guidelines
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                step: "1",
                                title: "Flag Content",
                                description: "Click the flag icon on any post or comment"
                            },
                            {
                                step: "2",
                                title: "Select Reason",
                                description: "Choose the guideline violation category"
                            },
                            {
                                step: "3",
                                title: "We Review",
                                description: "Moderators review within 48 hours"
                            }
                        ].map((item) => (
                            <div key={item.step} className="bg-white rounded-lg p-6 shadow-sm text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-2">
                                    Step {item.step}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-slate-600 text-sm">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Let's Build a Better Community Together
                    </h2>
                    <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                        By following these guidelines, we create a space where everyone can learn,
                        share, and grow in their health journey.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            href="/discussions/new"
                            className="px-8 py-4 bg-white text-green-600 rounded-lg font-bold hover:bg-green-50 transition-colors shadow-lg"
                        >
                            Start Contributing
                        </Link>
                        <Link
                            href="/moderation-policy"
                            className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold hover:bg-green-400 transition-colors shadow-lg border-2 border-white"
                        >
                            View Moderation Policy
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
