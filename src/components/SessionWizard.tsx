import React, { useState } from 'react';
import { Users, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

interface SessionWizardProps {
    onStartSession: () => Promise<void>;
    onJoinSession: (sessionId: string) => Promise<void>;
    isProcessing: boolean;
    language: 'he' | 'en';
    error?: string | null;
}

export default function SessionWizard({ onStartSession, onJoinSession, isProcessing, language, error }: SessionWizardProps) {
    const [mode, setMode] = useState<'menu' | 'join'>('menu');
    const [joinCode, setJoinCode] = useState('');

    const t = {
        he: {
            title: "מצב Live: גלו את הכימיה",
            subtitle: "השוו תשובות בזמן אמת וקבלו תובנות משותפות",
            start_btn: "יצירת סשן חדש",
            join_btn: "יש לי קוד סשן",
            code_label: "הקלידו את הקוד (6 תווים)",
            submit_start: "יצירה והתחלה",
            submit_join: "התחברות והתחלה",
            back: "חזרה",
            enter_code_instr: "הזינו את הקוד בן 6 התווים שקיבלתם מהשותף/ה."
        },
        en: {
            title: "Live Mode: Discover Chemistry",
            subtitle: "Compare answers in real-time and get shared insights",
            start_btn: "Start New Session",
            join_btn: "I Have a Code",
            code_label: "Enter 6-Character Code",
            submit_start: "Create & Start",
            submit_join: "Connect & Start",
            back: "Back",
            enter_code_instr: "Enter the 6-character code shared by your partner."
        }
    }[language];

    const isJoinValid = joinCode.length === 6;

    if (mode === 'menu') {
        return (
            <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-50 text-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#f3ecff] rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#f3ecff] rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 brand-gradient text-white rounded-3xl flex items-center justify-center mx-auto shadow-[0_6px_16px_rgba(140,80,240,0.20)] rotate-3">
                        <Users size={40} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{t.title}</h2>
                        <p className="text-slate-500 font-bold text-lg leading-snug max-w-xs mx-auto">{t.subtitle}</p>
                    </div>
                </div>

                <div className="grid gap-4 relative z-10">
                    <button
                        onClick={() => onStartSession()}
                        disabled={isProcessing}
                        className="w-full py-5 btn-gradient text-white rounded-2xl font-black text-xl hover:shadow-2xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={24} /> : (
                            <>
                                {t.start_btn}
                                {language === 'he' ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setMode('join')}
                        disabled={isProcessing}
                        className="w-full py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xl hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {t.join_btn}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-50 animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#a014f0] via-[#5078ff] to-[#3cdcf0]" />

            <button
                onClick={() => setMode('menu')}
                className="text-xs font-black text-slate-400 mb-8 hover:text-[#8c50f0] transition-colors flex items-center gap-1 uppercase tracking-widest"
            >
                {language === 'he' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />} {t.back}
            </button>

            <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-black text-slate-800 leading-none">{t.join_btn}</h2>
                <p className="text-slate-400 font-bold text-sm">{t.enter_code_instr}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onJoinSession(joinCode.toUpperCase()); }} className="space-y-6">
                <div className="space-y-4 pt-4">
                    <div className="text-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">{t.code_label}</label>
                        <input
                            type="text" required maxLength={6}
                            value={joinCode} onChange={e => setJoinCode(e.target.value)}
                            placeholder="______"
                            className="w-full p-6 bg-slate-50 rounded-3xl font-black text-4xl tracking-[0.5em] text-center uppercase text-[#6a2dd0] border-2 border-slate-200 focus:border-[#8c50f0] focus:ring-4 focus:ring-purple-100 outline-none transition-all placeholder:text-slate-200"
                            style={{ fontFamily: 'monospace' }}
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-sm font-bold text-red-600 text-center">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={isProcessing || !isJoinValid}
                    className={`w-full py-5 mt-6 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-2 transition-all
                        ${!isJoinValid
                            ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
                            : 'btn-gradient text-white hover:shadow-2xl hover:brightness-110 active:scale-95'}`}
                >
                    {isProcessing ? <Loader2 className="animate-spin" /> : (
                        <>
                            {t.submit_join}
                            {language === 'he' ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
