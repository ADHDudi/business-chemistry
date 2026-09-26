import React from 'react';
import { traitsList } from '../constants';
import { SessionData } from '../services/sessionService';
import { AlertCircle, CheckCircle, Minus } from 'lucide-react';
import { calculateResults, getPersona } from '../scoring';

/** Returns a clamped `left` value that keeps the 32 px dot within the track. */
export function dotLeftStyle(score: number): string {
  const pct = ((score - 1) / 5) * 100;
  return `clamp(0px, calc(${pct}% - 16px), calc(100% - 32px))`;
}

/** Match score: 100 - (mean absolute delta / 5) * 100, rounded to nearest integer. */
export function computeMatchScore(
  answersA: Record<number, number>,
  answersB: Record<number, number>
): number {
  const total = traitsList.length;
  if (total === 0) return 100;
  const sumDelta = traitsList.reduce((acc, _, idx) => {
    return acc + Math.abs((answersA[idx] ?? 0) - (answersB[idx] ?? 0));
  }, 0);
  const meanDelta = sumDelta / total;
  return Math.round(100 - (meanDelta / 5) * 100);
}

interface ComparisonViewProps {
    sessionData: SessionData;
    language: 'he' | 'en';
}

export default function ComparisonView({ sessionData, language }: ComparisonViewProps) {
    const { answersA, answersB, founderAName, founderBName } = sessionData;

    const resultsA = calculateResults(answersA);
    const resultsB = calculateResults(answersB);
    const personaA = getPersona(resultsA.formal, resultsA.dominant);
    const personaB = getPersona(resultsB.formal, resultsB.dominant);
    const matchScore = computeMatchScore(answersA, answersB);

    const t = {
        he: {
            title: "השוואת תשובות",
            legend_gap: "פער",
            legend_agreement: "הסכמה",
            legend_friction: "חיכוך פוטנציאלי",
            score: "ציון",
            delta: "הפרש",
            match: "התאמה",
        },
        en: {
            title: "Answer Comparison",
            legend_gap: "Gap",
            legend_agreement: "Agreement",
            legend_friction: "Potential Friction",
            score: "Score",
            delta: "Delta",
            match: "Match",
        }
    }[language];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-[2.5rem] p-4 sm:p-8 shadow-xl border border-slate-100">
                <h2 className="text-3xl font-black text-slate-800 mb-6 text-center">{t.title}</h2>

                {/* Persona comparison header */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-[#eef2ff] rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{founderAName}</p>
                        <p className="font-black text-[#324FA2] text-base leading-tight" data-testid="persona-label">
                            {personaA.title[language]}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-[#fff4ef] rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{founderBName}</p>
                        <p className="font-black text-[#E46B3F] text-base leading-tight" data-testid="persona-label">
                            {personaB.title[language]}
                        </p>
                    </div>
                </div>

                {/* Match score */}
                <div className="flex items-center justify-center gap-3 mb-8 p-4 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.match}</span>
                    <span className="text-4xl font-black text-slate-800" data-testid="match-score">{matchScore}%</span>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>{t.legend_agreement} (0-1)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <span>{t.legend_gap} (2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>{t.legend_friction} (3+)</span>
                    </div>
                </div>

                {/* Trait rows */}
                <div className="space-y-4">
                    {traitsList.map((trait, idx) => {
                        const scoreA = answersA[idx];
                        const scoreB = answersB[idx];

                        if (scoreA === undefined || scoreB === undefined) return null;

                        const delta = Math.abs(scoreA - scoreB);
                        let bgClass = "bg-green-50 border-green-100";
                        let badgeClass = "bg-green-100 text-green-700";
                        let Icon = CheckCircle;

                        if (delta >= 3) {
                            bgClass = "bg-red-50 border-red-100";
                            badgeClass = "bg-red-100 text-red-700";
                            Icon = AlertCircle;
                        } else if (delta === 2) {
                            bgClass = "bg-amber-50 border-amber-100";
                            badgeClass = "bg-amber-100 text-amber-700";
                            Icon = Minus;
                        }

                        return (
                            <div key={trait.id} className={`p-4 rounded-2xl border ${bgClass} transition-all hover:shadow-md`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black text-slate-400 w-8">{trait.id + 1}</span>
                                    <h3 className="font-bold text-slate-700 text-center flex-1 mx-2">
                                        {trait.left[language]} <span className="text-slate-300 px-1">-</span> {trait.right[language]}
                                    </h3>
                                    <div className={`px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${badgeClass}`}>
                                        <Icon size={12} />
                                        {t.delta}: {delta}
                                    </div>
                                </div>

                                <div className="relative h-2 bg-slate-200/50 rounded-full my-4 mx-2">
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#324FA2] text-white flex items-center justify-center font-black text-xs shadow-md z-10 border-2 border-white transition-all duration-500"
                                        style={{ left: dotLeftStyle(scoreA) }}
                                        title={`${founderAName}: ${scoreA}`}
                                    >
                                        A
                                    </div>
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E46B3F] text-white flex items-center justify-center font-black text-xs shadow-md z-10 border-2 border-white transition-all duration-500"
                                        style={{ left: dotLeftStyle(scoreB) }}
                                        title={`${founderBName}: ${scoreB}`}
                                    >
                                        B
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
