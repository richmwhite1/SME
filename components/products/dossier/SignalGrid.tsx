import React from 'react';

interface Signal {
    signal: string;
    lens_type: 'scientific' | 'alternative' | 'esoteric';
}

interface SignalGridProps {
    signals: Signal[];
}

export default function SignalGrid({ signals }: SignalGridProps) {
    // Group signals by text and count them
    const signalCounts = signals.reduce((acc, curr) => {
        const key = curr.signal;
        if (!acc[key]) {
            acc[key] = {
                count: 0,
                lens_type: curr.lens_type
            };
        }
        acc[key].count += 1;
        return acc;
    }, {} as Record<string, { count: number; lens_type: string }>);

    // Sort by count descending
    const sortedSignals = Object.entries(signalCounts).sort(([, a], [, b]) => b.count - a.count);

    if (sortedSignals.length === 0) {
        return null;
    }

    const getLensColor = (lens: string) => {
        switch (lens) {
            case 'scientific': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
            case 'alternative': return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
            case 'esoteric': return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
            default: return 'bg-white/10 text-white/70 border-white/20';
        }
    };

    return (
        <div className="mb-8">
            <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                <span>Signal Grid</span>
                <span className="text-xs font-sans font-normal text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                    {signals.length} signals detected
                </span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sortedSignals.map(([signal, { count, lens_type }]) => (
                    <div
                        key={signal}
                        className={`
              relative flex items-center justify-between p-3 rounded-lg border
              ${getLensColor(lens_type)}
              transition-all hover:bg-opacity-30
            `}
                    >
                        <span className="font-medium truncate mr-2" title={signal}>
                            {signal}
                        </span>
                        <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-black/20 text-xs font-mono font-bold">
                            {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
