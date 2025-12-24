'use client';

import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';

interface ProductRadarChartProps {
    data: {
        scientific: number;
        alternative: number;
        esoteric: number;
    };
}

export default function ProductRadarChart({ data }: ProductRadarChartProps) {
    // Transform data for Recharts
    const chartData = [
        {
            subject: 'Scientific 🧬',
            A: data.scientific,
            fullMark: 100,
            fill: '#3B82F6', // Blue-500
        },
        {
            subject: 'Alternative 🪵',
            A: data.alternative,
            fullMark: 100,
            fill: '#22C55E', // Green-500
        },
        {
            subject: 'Esoteric 👁️',
            A: data.esoteric,
            fullMark: 100,
            fill: '#EAB308', // Yellow-500 (Gold)
        },
    ];

    // Custom tick renderer to apply specific colors to labels
    const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
        let fill = '#E2E8F0'; // Default slate-200
        if (payload.value.includes('Scientific')) fill = '#60A5FA'; // Blue-400
        if (payload.value.includes('Alternative')) fill = '#4ADE80'; // Green-400
        if (payload.value.includes('Esoteric')) fill = '#FACC15'; // Yellow-400

        return (
            <text
                x={x}
                y={y}
                cx={cx}
                cy={cy}
                fill={fill}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize={12}
                fontWeight={600}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            >
                {payload.value}
            </text>
        );
    };

    return (
        <div
            className="w-full rounded-lg border border-white/10 bg-black/20 p-4 backdrop-blur-sm"
            aria-label={`Truth Balance Chart: Scientific ${data.scientific}%, Alternative ${data.alternative}%, Esoteric ${data.esoteric}%`}
        >
            <div className="mb-2 text-center">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/50">
                    Truth Balance
                </h3>
                <p className="text-[10px] text-white/30 italic">
                    Run by the community
                </p>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="#ffffff20" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={renderPolarAngleAxis}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        {/* 
               We're using a single Radar shape to represent the "area" covered by the product's score.
               The user asked for specific colors per axis. This is hard to do with a single polygon 
               unless we use gradients or separate shapes. 
               
               However, a single prominent shape usually looks best. 
               Let's try a neutral "Community" color (SME Goldish) with opacity, 
               and rely on the axis labels for the color coding as interpreted.
            */}
                        <Radar
                            name="Product Score"
                            dataKey="A"
                            stroke="#D4AF37"
                            strokeWidth={2}
                            fill="#D4AF37"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-2 text-center">
                <p className="text-[10px] text-white/40">
                    This represents the community&apos;s balance of evidence
                </p>
            </div>
        </div>
    );
}
