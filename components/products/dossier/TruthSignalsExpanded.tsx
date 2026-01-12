"use client";

import { Beaker, Sprout, Gem, Shield, AlertTriangle, FileText } from "lucide-react";

interface Signal {
    signal: string;
    lens_type: 'scientific' | 'alternative' | 'esoteric';
    reason?: string;
}

interface TruthSignalsExpandedProps {
    signals: Signal[];
    labReportUrl?: string | null;
    coaUrl?: string | null;
}

// Map signal labels to icons and styling
const SIGNAL_CONFIG: Record<string, { icon: any; color: string; bgColor: string; borderColor: string }> = {
    "Lab Tested": {
        icon: Beaker,
        color: "text-emerald-400",
        bgColor: "bg-emerald-900/10",
        borderColor: "border-emerald-500/50"
    },
    "Ancestral/Natural": {
        icon: Sprout,
        color: "text-green-400",
        bgColor: "bg-green-900/10",
        borderColor: "border-green-500/50"
    },
    "Energetic Benefits": {
        icon: Gem,
        color: "text-purple-400",
        bgColor: "bg-purple-900/10",
        borderColor: "border-purple-500/50"
    },
    "Safety Verified": {
        icon: Shield,
        color: "text-blue-400",
        bgColor: "bg-blue-900/10",
        borderColor: "border-blue-500/50"
    },
    "Known Risks": {
        icon: AlertTriangle,
        color: "text-red-400",
        bgColor: "bg-red-900/10",
        borderColor: "border-red-500/50"
    }
};

export default function TruthSignalsExpanded({
    signals,
    labReportUrl,
    coaUrl
}: TruthSignalsExpandedProps) {
    // Don't render if no signals
    if (!signals || signals.length === 0) return null;

    return (
        <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg mb-8">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-bone-white">
                    Truth Signals
                </h2>
            </div>

            <p className="text-sm text-bone-white/60 mb-6 font-mono">
                Objective strengths and weaknesses identified through multi-lens analysis
            </p>

            {/* Signals Grid */}
            <div className="space-y-4">
                {signals.map((signal, index) => {
                    const config = SIGNAL_CONFIG[signal.signal] || SIGNAL_CONFIG["Lab Tested"];
                    const Icon = config.icon;

                    return (
                        <div
                            key={index}
                            className={`border ${config.borderColor} ${config.bgColor} p-5 rounded-lg transition-all hover:scale-[1.01]`}
                        >
                            {/* Signal Header */}
                            <div className="flex items-start gap-3 mb-3">
                                <Icon className={`w-6 h-6 ${config.color} flex-shrink-0 mt-1`} />
                                <div className="flex-1">
                                    <h3 className={`font-semibold text-lg ${config.color}`}>
                                        {signal.signal}
                                    </h3>
                                    <span className="text-xs font-mono uppercase tracking-wider text-bone-white/50">
                                        {signal.lens_type} lens
                                    </span>
                                </div>
                            </div>

                            {/* Signal Justification */}
                            {signal.reason && (
                                <div className="ml-9 mt-3 pt-3 border-t border-white/10">
                                    <p className="text-bone-white/80 text-sm md:text-base leading-relaxed">
                                        {signal.reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Supporting Documents */}
            {(labReportUrl || coaUrl) && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3">
                        Supporting Documentation
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {coaUrl && (
                            <a
                                href={coaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded text-sm text-bone-white hover:bg-white/10 hover:border-emerald-500/50 transition-all"
                            >
                                <FileText className="w-4 h-4 text-emerald-400" />
                                Certificate of Analysis
                                <span className="text-xs">↗</span>
                            </a>
                        )}
                        {labReportUrl && (
                            <a
                                href={labReportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded text-sm text-bone-white hover:bg-white/10 hover:border-emerald-500/50 transition-all"
                            >
                                <Beaker className="w-4 h-4 text-emerald-400" />
                                Lab Report
                                <span className="text-xs">↗</span>
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
