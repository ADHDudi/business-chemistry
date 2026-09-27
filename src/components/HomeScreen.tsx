import React, { useEffect, useState } from 'react';
import { Users, Play, RotateCcw, Loader2 } from 'lucide-react';
import { getLatestReport, UserReport } from '../services/reportingService';
import { PERSONA_DATA } from '../constants';
import { Language } from '../types';

interface HomeScreenProps {
    uid: string;
    language: Language;
    onStartSolo: () => void;
    onStartSession: () => void;
    onJoinSession: () => void;
}

const t = {
    en: {
        you: 'You',
        pair: 'Pair Sessions',
        start_analysis: 'Start Your Analysis',
        redo: 'Redo Analysis',
        start_session: 'Start a Pair Session',
        join_session: 'Join a Session',
        pair_locked: 'Complete your own analysis first',
        loading: 'Loading your profile...',
        no_pair: 'No pair sessions yet',
        basics: 'Your Profile',
    },
    he: {
        you: 'אתה',
        pair: 'סשנים משותפים',
        start_analysis: 'התחל/י את הניתוח',
        redo: 'ניתוח מחדש',
        start_session: 'התחל סשן משותף',
        join_session: 'הצטרף לסשן',
        pair_locked: 'השלם/י את הניתוח האישי תחילה',
        loading: 'טוען פרופיל...',
        no_pair: 'אין סשנים משותפים עדיין',
        basics: 'הפרופיל שלך',
    },
};

export default function HomeScreen({ uid, language, onStartSolo, onStartSession, onJoinSession }: HomeScreenProps) {
    const [report, setReport] = useState<UserReport | null | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'you' | 'pair'>('you');
    const copy = t[language];

    useEffect(() => {
        getLatestReport(uid).then(setReport);
    }, [uid]);

    const persona = report ? PERSONA_DATA[report.personaKey as keyof typeof PERSONA_DATA] : null;
    const hasReport = !!report;

    if (report === undefined) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-[#8c50f0]" size={32} />
                <span className="ml-3 font-bold text-slate-500">{copy.loading}</span>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tab bar */}
            <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
                {(['you', 'pair'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-[#8c50f0] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab === 'you' ? copy.you : copy.pair}
                    </button>
                ))}
            </div>

            {activeTab === 'you' && (
                <div className="space-y-4">
                    {hasReport && persona ? (
                        <>
                            {/* Persona summary */}
                            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 space-y-4" data-testid="persona-summary">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{copy.basics}</p>
                                <h2 className="text-2xl font-black text-slate-800">{persona.title[language]}</h2>
                                <p className="text-slate-600 font-medium leading-relaxed">{persona.description[language]}</p>
                            </div>

                            <button
                                onClick={onStartSolo}
                                data-testid="redo-analysis-btn"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors"
                            >
                                <RotateCcw size={16} />
                                {copy.redo}
                            </button>
                        </>
                    ) : (
                        /* Empty state */
                        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-[#f3ecff] rounded-2xl flex items-center justify-center mx-auto">
                                <Play size={32} className="text-[#8c50f0]" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-slate-800">
                                    {language === 'en' ? 'Discover Your Communication Style' : 'גלה/י את סגנון התקשורת שלך'}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm">
                                    {language === 'en' ? 'Take the 35-question assessment to get your persona and insights.' : 'ענה/י על 35 שאלות כדי לקבל את הפרסונה והתובנות שלך.'}
                                </p>
                            </div>
                            <button
                                onClick={onStartSolo}
                                data-testid="start-analysis-btn"
                                className="w-full py-4 btn-gradient text-white rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl"
                            >
                                {copy.start_analysis}
                            </button>
                        </div>
                    )}

                    {/* Pair session entry */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={onStartSession}
                            disabled={!hasReport}
                            data-testid="start-session-btn"
                            title={!hasReport ? copy.pair_locked : undefined}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all ${hasReport ? 'btn-gradient text-white shadow-lg active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                            <Users size={16} />
                            {copy.start_session}
                        </button>
                        <button
                            onClick={onJoinSession}
                            disabled={!hasReport}
                            data-testid="join-session-btn"
                            title={!hasReport ? copy.pair_locked : undefined}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all ${hasReport ? 'bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                            {copy.join_session}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'pair' && (
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 text-center">
                    <p className="text-slate-400 font-bold text-sm">{copy.no_pair}</p>
                </div>
            )}
        </div>
    );
}
