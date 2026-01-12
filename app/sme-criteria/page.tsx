import { Metadata } from "next";
import Link from "next/link";
import {
    Award,
    TrendingUp,
    CheckCircle,
    Users,
    BookOpen,
    Target,
    Shield,
    Sparkles
} from "lucide-react";

export const metadata: Metadata = {
    title: "SME Criteria | Subject Matter Expert Standards",
    description: "Learn about our transparent SME standards, expertise criteria, review processes, and reputation building system.",
};

export default function SMECriteriaPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center">
                        <Award className="w-16 h-16 mx-auto mb-6 opacity-90" />
                        <h1 className="text-5xl font-bold mb-6">SME Criteria</h1>
                        <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                            Transparent criteria for Subject Matter Experts, our review process,
                            and how reputation is built through quality contributions
                        </p>
                    </div>
                </div>
            </section>

            {/* What is an SME Section */}
            <section className="py-16 max-w-6xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-lg p-10 border border-slate-200">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-indigo-600" />
                        What is a Subject Matter Expert (SME)?
                    </h2>
                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                        An SME is a community member who has demonstrated expertise through either
                        <strong className="text-indigo-600"> scientific credentials</strong> or
                        <strong className="text-indigo-600"> experiential knowledge</strong>, combined with
                        consistent, high-quality contributions to our platform.
                    </p>
                    <p className="text-lg text-slate-700 leading-relaxed">
                        SMEs have earned <strong>100+ reputation points</strong> and maintain a track record
                        of providing evidence-based, helpful insights that benefit the community.
                    </p>
                </div>
            </section>

            {/* Expertise Criteria Section */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                        Two Paths to Expertise
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Scientific Expertise */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-200">
                            <div className="flex items-center gap-3 mb-6">
                                <BookOpen className="w-10 h-10 text-blue-600" />
                                <h3 className="text-2xl font-bold text-slate-900">Scientific Expertise</h3>
                            </div>

                            <p className="text-slate-700 mb-6">
                                Formal education and professional credentials in relevant fields
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Advanced degrees (PhD, MD, MS) in health sciences",
                                    "Licensed healthcare professionals (RD, ND, DC)",
                                    "Certified nutritionists or dietitians",
                                    "Research scientists with published work",
                                    "Clinical practitioners with verifiable credentials"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                        <span className="text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-900">
                                    <strong>Verification:</strong> Credentials are reviewed by our admin team.
                                    You&apos;ll need to provide proof of qualifications.
                                </p>
                            </div>
                        </div>

                        {/* Experiential Expertise */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-200">
                            <div className="flex items-center gap-3 mb-6">
                                <Users className="w-10 h-10 text-green-600" />
                                <h3 className="text-2xl font-bold text-slate-900">Experiential Expertise</h3>
                            </div>

                            <p className="text-slate-700 mb-6">
                                Deep practical knowledge gained through personal experience and research
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Years of personal health optimization experience",
                                    "Extensive self-experimentation and tracking",
                                    "Deep knowledge of specific supplements or protocols",
                                    "Active participation in health communities",
                                    "Ability to cite research and provide evidence"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                        <span className="text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-green-900">
                                    <strong>Verification:</strong> Demonstrated through quality contributions,
                                    upvotes, and community recognition over time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reputation System Section */}
            <section className="py-16 max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        Reputation System
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        Earn reputation through quality contributions. Your reputation unlocks features and builds trust.
                    </p>
                </div>

                {/* Reputation Tiers */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    {[
                        {
                            name: "Member",
                            range: "0-49",
                            color: "bg-slate-100 border-slate-300 text-slate-700",
                            benefits: ["Access discussions", "Upvote content", "Comment on products"]
                        },
                        {
                            name: "Bronze",
                            range: "50-99",
                            color: "bg-orange-100 border-orange-300 text-orange-700",
                            benefits: ["Reduced moderation", "Profile badge", "Priority support"]
                        },
                        {
                            name: "Silver (SME)",
                            range: "100-499",
                            color: "bg-gray-100 border-gray-400 text-gray-700",
                            benefits: ["SME status", "Review products", "Featured content"]
                        },
                        {
                            name: "Gold",
                            range: "500-999",
                            color: "bg-yellow-100 border-yellow-400 text-yellow-700",
                            benefits: ["Expert badge", "Moderation tools", "Platform influence"]
                        }
                    ].map((tier) => (
                        <div
                            key={tier.name}
                            className={`rounded-xl shadow-lg p-6 border-2 ${tier.color}`}
                        >
                            <div className="text-2xl font-bold mb-2">
                                {tier.name}
                            </div>
                            <div className="text-sm text-slate-600 mb-4 font-medium">
                                {tier.range} points
                            </div>
                            <ul className="space-y-2">
                                {tier.benefits.map((benefit, idx) => (
                                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* How to Earn Reputation */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-10 border border-indigo-200">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">
                        How to Earn Reputation Points
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { action: "Discussion upvoted", points: "+1 per upvote" },
                            { action: "Comment upvoted", points: "+1 per upvote" },
                            { action: "Product review upvoted", points: "+1 per upvote" },
                            { action: "Quality contribution badge", points: "+10" },
                            { action: "Expert verification", points: "+50" },
                            { action: "Flagged content (penalty)", points: "-5" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                                <span className="text-slate-700 font-medium">{item.action}</span>
                                <span className={`font-bold ${item.points.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.points}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Review Process Section */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <Target className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Review Process for Contributions
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            All contributions go through a multi-layered review process to ensure quality and accuracy
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "1",
                                title: "AI Pre-Screening",
                                description: "Automated checks for spam, inappropriate content, and basic quality standards",
                                icon: Shield
                            },
                            {
                                step: "2",
                                title: "Community Voting",
                                description: "Members upvote helpful content and flag problematic contributions",
                                icon: Users
                            },
                            {
                                step: "3",
                                title: "SME Review",
                                description: "Experienced SMEs provide expert validation and additional context",
                                icon: Award
                            }
                        ].map((item) => (
                            <div key={item.step} className="bg-white rounded-xl shadow-lg p-8 text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <item.icon className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div className="text-3xl font-bold text-indigo-600 mb-2">
                                    Step {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-slate-600">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 max-w-4xl mx-auto px-4">
                <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
                    Frequently Asked Questions
                </h2>

                <div className="space-y-6">
                    {[
                        {
                            q: "How long does it take to become an SME?",
                            a: "It varies by individual. Active contributors who provide quality, evidence-based insights typically reach 100 reputation points within 2-3 months. Focus on helpful, well-researched contributions rather than quantity."
                        },
                        {
                            q: "Can I lose my SME status?",
                            a: "Yes. If your reputation drops below 100 points due to flagged content or community downvotes, your SME status will be automatically revoked. This ensures ongoing quality standards."
                        },
                        {
                            q: "Do I need formal credentials to be an SME?",
                            a: "No. While formal credentials help, experiential expertise is equally valued. Demonstrate your knowledge through quality contributions, citations, and community recognition."
                        },
                        {
                            q: "How are credentials verified?",
                            a: "For scientific expertise, you'll submit proof of credentials (degrees, licenses) to our admin team. All information is kept confidential and only used for verification purposes."
                        },
                        {
                            q: "What happens if I disagree with a moderation decision?",
                            a: "You can submit an appeal through our moderation policy page. All appeals are reviewed by human moderators within 48 hours."
                        }
                    ].map((faq, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">
                                {faq.q}
                            </h3>
                            <p className="text-slate-700 leading-relaxed">
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Ready to Start Contributing?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join our community of experts and enthusiasts. Share your knowledge,
                        help others, and build your reputation.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            href="/discussions/new"
                            className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-lg"
                        >
                            Start a Discussion
                        </Link>
                        <Link
                            href="/products"
                            className="px-8 py-4 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-400 transition-colors shadow-lg border-2 border-white"
                        >
                            Review a Product
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
