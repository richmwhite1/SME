import React from 'react';
import { Beaker, Leaf, Sparkles } from 'lucide-react';

interface TriplePillarScoresProps {
    scientific: number;
    alternative: number;
    esoteric: number;
}

export default function TriplePillarScores({
    scientific,
    alternative,
    esoteric
}: TriplePillarScoresProps) {

    const PillarBar = ({
        label,
        score,
        icon: Icon,
        colorClass
    }: {
        label: string;
        score: number;
        icon: any;
        colorClass: string;
    }) => (
        <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon size={16} className="text-white/60" />
                    <span className="font-mono text-xs uppercase tracking-wider text-white/70">
                        {label}
                    </span>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                    {score}%
                </span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <h3 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-3">
                Triple-Pillar Analysis
            </h3>

            <div className="flex flex-col md:flex-row gap-8 justify-between">
                <PillarBar
                    label="Scientific Rigor"
                    score={scientific}
                    icon={Beaker}
                    colorClass="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
                <PillarBar
                    label="Holistic / Alt"
                    score={alternative}
                    icon={Leaf}
                    colorClass="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
                <PillarBar
                    label="Esoteric / Trad"
                    score={esoteric}
                    icon={Sparkles}
                    colorClass="bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                />
            </div>
        </div>
    );
}
