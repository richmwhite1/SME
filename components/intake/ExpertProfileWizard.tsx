"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Sparkles, Award, Beaker, Sprout, Eye, FileText, ExternalLink } from "lucide-react";
import { submitExpertProfile } from "@/app/actions/sme-actions";

// Initial State for Server Action
const initialState = {
    message: "",
    success: false,
    errors: undefined
};

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/50 px-8 py-2 text-xs uppercase tracking-wider text-emerald-400 hover:bg-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? "Processing..." : "Submit for Review"} <Check className="w-3 h-3" />
        </button>
    );
}

interface MasterTopic {
    name: string;
    description: string | null;
}

export default function ExpertProfileWizard() {
    const [step, setStep] = useState(1);
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
    const [expertiseType, setExpertiseType] = useState<string>("");
    const [experienceLineage, setExperienceLineage] = useState<string>("");
    const [portfolioUrl, setPortfolioUrl] = useState<string>("");
    const [topics, setTopics] = useState<MasterTopic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(true);
    const [state, formAction] = useFormState(submitExpertProfile, initialState);
    const router = useRouter();

    // Fetch master topics
    useEffect(() => {
        async function fetchTopics() {
            try {
                const res = await fetch('/api/topics/master');
                if (res.ok) {
                    const data = await res.json();
                    setTopics(data);
                }
            } catch (error) {
                console.error('Failed to fetch master topics', error);
            } finally {
                setLoadingTopics(false);
            }
        }
        fetchTopics();
    }, []);

    useEffect(() => {
        if (state.success) {
            // Redirect to user profile after successful submission
            setTimeout(() => {
                router.push('/u/me');
                router.refresh();
            }, 2000);
        }
    }, [state.success, router]);

    const toggleTopic = (topicName: string) => {
        const newSelected = new Set(selectedTopics);
        if (newSelected.has(topicName)) {
            newSelected.delete(topicName);
        } else {
            newSelected.add(topicName);
        }
        setSelectedTopics(newSelected);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        setStep(prev => prev + 1);
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setStep(prev => prev - 1);
    };

    const canProceedFromStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 2:
                return selectedTopics.size > 0;
            case 3:
                return expertiseType !== "";
            case 4:
                return experienceLineage.trim().length > 0;
            default:
                return true;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl border border-[#333] bg-[#111] shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 border border-emerald-900/30 text-emerald-900/30 px-2 py-1 text-xs rotate-12 pointer-events-none select-none">
                    SME CANDIDATE
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900/50 via-emerald-500/50 to-emerald-900/50" />

                <div className="p-8">
                    <header className="mb-8 border-b border-[#333] pb-4 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-emerald-500 uppercase">Expert Profile</h1>
                            <p className="text-sm text-gray-500 mt-1">Complete Your SME Certification</p>
                        </div>
                        <div className="text-xs text-gray-600">
                            STEP {step} OF 5
                        </div>
                    </header>

                    {state.message && (
                        <div className={`mb-6 p-4 border ${state.success ? 'border-emerald-500/50 bg-emerald-900/10 text-emerald-400' : 'border-red-500/50 bg-red-900/10 text-red-400'}`}>
                            {state.message}
                        </div>
                    )}

                    <form action={formAction} className="space-y-8">
                        {/* Hidden Inputs for Form Data */}
                        <input type="hidden" name="topics" value={JSON.stringify(Array.from(selectedTopics))} />
                        <input type="hidden" name="expertise_type" value={expertiseType} />
                        <input type="hidden" name="experience_lineage" value={experienceLineage} />
                        <input type="hidden" name="portfolio_url" value={portfolioUrl} />

                        {/* STEP 1: WELCOME */}
                        <div className={step === 1 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <div className="flex flex-col items-center text-center space-y-6 py-8">
                                <div className="w-20 h-20 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center">
                                    <Award className="w-10 h-10 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-4">
                                        Congratulations!
                                    </h2>
                                    You&apos;ve reached <span className="text-emerald-400 font-bold">100+ reputation</span> and are now eligible for Subject Matter Expert (SME) status.
                                </div>
                                <div className="border border-[#333] bg-[#0a0a0a] p-6 rounded space-y-4 max-w-2xl">
                                    <h3 className="text-sm uppercase tracking-wider text-emerald-500 font-semibold">SME Benefits</h3>
                                    <ul className="text-sm text-gray-400 space-y-2 text-left">
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-white">Bypass Upvote Thresholds:</strong> Your contributions are automatically trusted</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-white">Join the Tribunal:</strong> Participate in high-level community governance</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-white">Expert Badge:</strong> Display your verified expertise across the platform</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <span><strong className="text-white">Priority Summons:</strong> Get notified when your expertise is needed</span>
                                        </li>
                                    </ul>
                                </div>
                                <p className="text-sm text-gray-500 max-w-2xl">
                                    Complete this profile to help us understand your areas of expertise and submit your application for admin review.
                                </p>
                            </div>
                        </div>

                        {/* STEP 2: TOPIC SELECTION */}
                        <div className={step === 2 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                I. Areas of Expertise
                            </h2>
                            Select the topics you want to be &quot;summoned&quot; for when your expertise is needed. Choose at least one.

                            {loadingTopics ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {topics.map((topic) => {
                                        const isSelected = selectedTopics.has(topic.name);
                                        return (
                                            <button
                                                key={topic.name}
                                                type="button"
                                                onClick={() => toggleTopic(topic.name)}
                                                className={`
                                                    cursor-pointer border p-4 flex flex-col items-start gap-2 transition-all duration-200 text-left
                                                    ${isSelected
                                                        ? "border-emerald-500 bg-emerald-900/10 text-emerald-400"
                                                        : "border-[#333] hover:border-gray-500 text-gray-400"}
                                                `}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-semibold text-sm">{topic.name}</span>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </div>
                                                {topic.description && (
                                                    <span className="text-xs opacity-70 line-clamp-2">{topic.description}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {selectedTopics.size === 0 && (
                                <p className="text-xs text-red-400 mt-4">⚠️ Please select at least one topic</p>
                            )}
                        </div>

                        {/* STEP 3: EXPERTISE TYPE */}
                        <div className={step === 3 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                II. Primary Lens
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Choose your primary approach to health and wellness. This helps us match you with relevant discussions.
                            </p>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setExpertiseType("Scientific")}
                                    className={`w-full border p-6 flex items-start gap-4 transition-all duration-200 text-left ${expertiseType === "Scientific"
                                        ? "border-blue-500 bg-blue-900/10"
                                        : "border-[#333] hover:border-gray-500"
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0 ${expertiseType === "Scientific" ? "border-blue-500 bg-blue-500/20" : "border-[#333] bg-[#0a0a0a]"
                                        }`}>
                                        <Beaker className={`w-6 h-6 ${expertiseType === "Scientific" ? "text-blue-400" : "text-gray-500"}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">🧬</span>
                                            <h3 className={`font-bold text-lg ${expertiseType === "Scientific" ? "text-blue-400" : "text-white"}`}>
                                                Scientific
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Empirical data, clinical research, peer-reviewed studies, and evidence-based protocols
                                        </p>
                                    </div>
                                    {expertiseType === "Scientific" && <Check className="w-5 h-5 text-blue-400" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setExpertiseType("Alternative")}
                                    className={`w-full border p-6 flex items-start gap-4 transition-all duration-200 text-left ${expertiseType === "Alternative"
                                        ? "border-green-500 bg-green-900/10"
                                        : "border-[#333] hover:border-gray-500"
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0 ${expertiseType === "Alternative" ? "border-green-500 bg-green-500/20" : "border-[#333] bg-[#0a0a0a]"
                                        }`}>
                                        <Sprout className={`w-6 h-6 ${expertiseType === "Alternative" ? "text-green-400" : "text-gray-500"}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">🪵</span>
                                            <h3 className={`font-bold text-lg ${expertiseType === "Alternative" ? "text-green-400" : "text-white"}`}>
                                                Alternative
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Ancestral wisdom, holistic protocols, traditional medicine, and natural healing practices
                                        </p>
                                    </div>
                                    {expertiseType === "Alternative" && <Check className="w-5 h-5 text-green-400" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setExpertiseType("Esoteric")}
                                    className={`w-full border p-6 flex items-start gap-4 transition-all duration-200 text-left ${expertiseType === "Esoteric"
                                        ? "border-purple-500 bg-purple-900/10"
                                        : "border-[#333] hover:border-gray-500"
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0 ${expertiseType === "Esoteric" ? "border-purple-500 bg-purple-500/20" : "border-[#333] bg-[#0a0a0a]"
                                        }`}>
                                        <Eye className={`w-6 h-6 ${expertiseType === "Esoteric" ? "text-purple-400" : "text-gray-500"}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">👁️</span>
                                            <h3 className={`font-bold text-lg ${expertiseType === "Esoteric" ? "text-purple-400" : "text-white"}`}>
                                                Esoteric
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Energetic healing, subtle-body work, consciousness exploration, and metaphysical practices
                                        </p>
                                    </div>
                                    {expertiseType === "Esoteric" && <Check className="w-5 h-5 text-purple-400" />}
                                </button>
                            </div>
                            {!expertiseType && (
                                <p className="text-xs text-red-400 mt-4">⚠️ Please select your primary expertise type</p>
                            )}
                        </div>

                        {/* STEP 4: EXPERIENCE/LINEAGE */}
                        <div className={step === 4 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                III. Your Journey
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Share your experience, background, and lineage in your field of expertise. This helps the admin understand your qualifications.
                            </p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Experience & Lineage <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={experienceLineage}
                                        onChange={(e) => setExperienceLineage(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[200px]"
                                        placeholder="Describe your background, training, certifications, years of practice, notable achievements, or lineage in your field. Be specific about your qualifications and experience..."
                                    />
                                    Examples: &quot;10+ years as a functional medicine practitioner...&quot;, &quot;Studied under Master herbalist...&quot;, &quot;PhD in Neuroscience with focus on...&quot;
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Portfolio / Credentials URL (Optional)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={portfolioUrl}
                                            onChange={(e) => setPortfolioUrl(e.target.value)}
                                            className="flex-1 bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                            placeholder="https://... (Link to your website, LinkedIn, publications, etc.)"
                                        />
                                        <div className="bg-[#1a1a1a] border border-[#333] p-3 text-gray-500 flex items-center justify-center">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {experienceLineage.trim().length === 0 && (
                                <p className="text-xs text-red-400 mt-4">⚠️ Please describe your experience and background</p>
                            )}
                        </div>

                        {/* STEP 5: REVIEW & SUBMIT */}
                        <div className={step === 5 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                IV. Review & Submit
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Review your expert profile before submitting for admin approval.
                            </p>

                            <div className="space-y-6 border border-[#333] bg-[#0a0a0a] p-6">
                                {/* Topics */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">Areas of Expertise</h3>
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(selectedTopics).map((topic) => (
                                            <span
                                                key={topic}
                                                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Expertise Type */}
                                <div className="border-t border-[#333] pt-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">Primary Lens</h3>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {expertiseType === "Scientific" && <span className="text-2xl">🧬</span>}
                                        {expertiseType === "Alternative" && <span className="text-2xl">🪵</span>}
                                        {expertiseType === "Esoteric" && <span className="text-2xl">👁️</span>}
                                        <span className="text-white font-semibold">{expertiseType}</span>
                                    </div>
                                </div>

                                {/* Experience */}
                                <div className="border-t border-[#333] pt-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">Experience & Lineage</h3>
                                        <button
                                            type="button"
                                            onClick={() => setStep(4)}
                                            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                                        {experienceLineage}
                                    </p>
                                    {portfolioUrl && (
                                        <a
                                            href={portfolioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            View Portfolio
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 p-4 border border-yellow-500/30 bg-yellow-500/5">
                                Your application will be reviewed by an admin. You&apos;ll be notified once your SME status is approved.
                            </div>
                        </div>

                        {/* NAVIGATION */}
                        <div className="flex justify-between pt-6 border-t border-[#333] mt-8">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-2 text-xs uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
                                >
                                    Back
                                </button>
                            ) : <div />}

                            {step < 5 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canProceedFromStep(step)}
                                    className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] px-6 py-2 text-xs uppercase tracking-wider text-white hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next Step <ChevronRight className="w-3 h-3" />
                                </button>
                            ) : (
                                <SubmitButton />
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
