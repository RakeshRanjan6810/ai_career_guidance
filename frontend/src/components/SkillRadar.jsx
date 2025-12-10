import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const SkillRadar = ({ data }) => {
    // Fallback data if none provided
    const chartData = data || [
        { subject: 'Technical', A: 0, B: 100, fullMark: 150 },
        { subject: 'Communication', A: 0, B: 100, fullMark: 150 },
        { subject: 'Leadership', A: 0, B: 100, fullMark: 150 },
        { subject: 'Problem Solving', A: 0, B: 100, fullMark: 150 },
        { subject: 'Creativity', A: 0, B: 100, fullMark: 150 },
    ];
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Skill Gap Analysis</h3>
                <p className="text-sm text-slate-500">Current vs Required Skills for "Senior Dev"</p>
            </div>

            <div className="h-[300px] w-full min-w-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar
                            name="Current Skills"
                            dataKey="A"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="#6366f1"
                            fillOpacity={0.2}
                        />
                        <Radar
                            name="Required Skills"
                            dataKey="B"
                            stroke="#cbd5e1"
                            strokeWidth={2}
                            fill="#cbd5e1"
                            fillOpacity={0.2}
                        />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SkillRadar;
