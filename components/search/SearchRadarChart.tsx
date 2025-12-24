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

interface SearchRadarChartProps {
    data: {
        scientific: number;
        alternative: number;
        esoteric: number;
    };
    className?: string;
}

export default function SearchRadarChart({ data, className }: SearchRadarChartProps) {
    const chartData = [
        { subject: '🧬', A: data.scientific || 0, fullMark: 100 },
        { subject: '🪵', A: data.alternative || 0, fullMark: 100 },
        { subject: '👁️', A: data.esoteric || 0, fullMark: 100 },
    ];

    return (
        <div className={`relative ${className || 'h-[100px] w-[100px]'}`} aria-label="Truth balance: Scientific, Alternative, Esoteric">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                    <PolarGrid stroke="#ffffff20" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#ffffff60', fontSize: 10 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#D4AF37"
                        strokeWidth={1.5}
                        fill="#D4AF37"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
