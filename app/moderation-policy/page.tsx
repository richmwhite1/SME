import { Metadata } from "next";
import Link from "next/link";
import { Shield, Flag, Users, Clock, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { getModerationMetrics } from "@/app/actions/moderation-transparency-actions";

export const metadata: Metadata = {
    title: "Moderation Policy | Community Standards",
    description: "Our transparent moderation policy, flagging system, AI-assisted moderation, and appeal process.",
};

export default async function ModerationPolicyPage() {
    const metrics = await getModerationMetrics();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center">
                        <Shield className="w-16 h-16 mx-auto mb-6 opacity-90" />
                        <h1 className="text-5xl font-bold mb-6">Moderation Policy</h1>
                        <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
                            Transparent guidelines for content moderation, community self-regulation,
                            and our commitment to maintaining a constructive, evidence-based platform
                        </p>
                    </div>
                </div>
            </section>

            {/* Philosophy Section */}
            <section className="py-16 max-w-6xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-lg p-10 border border-slate-200">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">
                        Our Moderation Philosophy
                    </h2>
                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                        We believe in <strong className="text-indigo-600">community-driven moderation</strong> combined
                        with <strong className="text-indigo-600">AI-assisted screening</strong>. Our goal is to maintain
                        a constructive environment where evidence-based discussions thrive while minimizing spam,
                        misinformation, and harmful content.
                    </p>
                    <p className="text-lg text-slate-700 leading-relaxed">
                        We prioritize <strong>transparency</strong>, <strong>fairness</strong>, and
                        <strong> user empowerment</strong> in all moderation decisions.
                    </p>
                </div>
            </section>

            {/* Transparency Metrics */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                        Moderation Transparency (Last 30 Days)
                    </h2>

                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            <Flag className="w-10 h-10 mx-auto mb-3 text-red-600" />
                            <div className="text-3xl font-bold text-slate-900 mb-2">
                                {metrics.total_flags_30d}
                            </div>
                            <div className="text-sm text-slate-600">Total Flags</div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-600" />
                            <div className="text-3xl font-bold text-slate-900 mb-2">
                                {metrics.total_resolved_30d}
                            </div>
                            <div className="text-sm text-slate-600">Resolved</div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            <Clock className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                            <div className="text-3xl font-bold text-slate-900 mb-2">
                                {metrics.avg_resolution_hours.toFixed(1)}h
                            </div>
                            <div className="text-sm text-slate-600">Avg Resolution Time</div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            <Users className="w-10 h-10 mx-auto mb-3 text-purple-600" />
                            <div className="text-3xl font-bold text-slate-900 mb-2">
                                {metrics.community_flag_ratio.toFixed(0)}%
                            </div>
                            <div className="text-sm text-slate-600">Community Flags</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Flagging System */}
            <section className="py-16 max-w-6xl mx-auto px-4">
                <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                    How Flagging Works
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <Flag className="w-8 h-8 text-red-600" />
                            Community Flagging
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-900">Any member can flag content</strong>
                                    <p className="text-slate-600 text-sm mt-1">
                                        Report spam, misinformation, or violations of community guidelines
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-900">Auto-hide at 3 flags</strong>
                                    <p className="text-slate-600 text-sm mt-1">
                                        Content is automatically hidden pending review after 3 community flags
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-900">Human review within 48h</strong>
                                    <p className="text-slate-600 text-sm mt-1">
                                        All flagged content is reviewed by moderators within 48 hours
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-600" />
                            AI-Assisted Moderation
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-900">Spam detection</strong>
                                    <p className="text-slate-600 text-sm mt-1">
                                        Automated filtering of obvious spam and promotional content
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-900">Keyword screening</strong>
                                    <p className="text-slate-600 text-sm mt-1">
                                        Flagging of prohibited keywords and inappropriate language
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <strong className="text-slate-900">Quality scoring</strong>
                                    <p className="text-slate-600 text-sm mt-1">
                                        AI assessment of contribution quality and relevance
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* What Gets Flagged */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                        Content Violations
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "Spam & Promotion",
                                items: ["Unsolicited advertising", "Affiliate link spam", "Repetitive posting", "Off-topic promotion"]
                            },
                            {
                                title: "Misinformation",
                                items: ["Unsubstantiated health claims", "Dangerous medical advice", "Conspiracy theories", "Fake citations"]
                            },
                            {
                                title: "Harmful Content",
                                items: ["Harassment or bullying", "Hate speech", "Personal attacks", "Doxxing or privacy violations"]
                            }
                        ].map((category, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                    {category.title}
                                </h3>
                                <ul className="space-y-2">
                                    {category.items.map((item, itemIdx) => (
                                        <li key={itemIdx} className="text-slate-700 text-sm flex items-start gap-2">
                                            <span className="text-red-600 mt-1">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Appeal Process */}
            <section className="py-16 max-w-6xl mx-auto px-4">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-10 border border-purple-200">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <FileText className="w-10 h-10 text-purple-600" />
                        Appeal Process
                    </h2>

                    <p className="text-lg text-slate-700 mb-8">
                        If you believe your content was incorrectly flagged, you can submit an appeal.
                        All appeals are reviewed by human moderators.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {[
                            {
                                step: "1",
                                title: "Submit Appeal",
                                description: "Explain why you believe the moderation decision was incorrect"
                            },
                            {
                                step: "2",
                                title: "Human Review",
                                description: "A moderator reviews your appeal and the original content"
                            },
                            {
                                step: "3",
                                title: "Decision",
                                description: "You're notified of the decision within 48 hours"
                            }
                        ].map((item) => (
                            <div key={item.step} className="bg-white rounded-lg p-6 shadow-sm">
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

                    <div className="bg-white rounded-lg p-6 border border-purple-200">
                        <h4 className="font-bold text-slate-900 mb-3">Appeal Statistics (Last 30 Days)</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-700">Appeals Submitted</span>
                                <span className="font-bold text-slate-900">{metrics.appeals_submitted_30d}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-700">Approval Rate</span>
                                <span className="font-bold text-green-600">{metrics.appeals_approval_rate.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Questions About Moderation?
                    </h2>
                    <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                        If you have questions about our moderation policy or need to report an issue,
                        we're here to help.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            href="/contact"
                            className="px-8 py-4 bg-white text-purple-600 rounded-lg font-bold hover:bg-purple-50 transition-colors shadow-lg"
                        >
                            Contact Moderators
                        </Link>
                        <Link
                            href="/community-guidelines"
                            className="px-8 py-4 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-400 transition-colors shadow-lg border-2 border-white"
                        >
                            View Community Guidelines
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
