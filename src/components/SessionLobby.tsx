import React, { useState } from 'react';
import { Copy, Check, Users, Loader2 } from 'lucide-react';
import { SessionData } from '../services/sessionService';

interface SessionLobbyProps {
    sessionData: SessionData;
    myRole: 'A' | 'B';
    language: 'he' | 'en';
}

export default function SessionLobby({ sessionData, myRole, language }: SessionLobbyProps) {
    const [copied, setCopied] = useState(false);

    const t = {
        he: {
            waiting_title: "ממתינים לשותף...",
            connected_title: "מחוברים!",
            code_label: "קוד סשן",
            share_instr: "שתפו את הקוד עם השותף/ה:",
            partner: "שותף",
            status_waiting: "ממתין להצטרפות...",
            status_working: "עונה על השאלון...",
            status_done: "סיים!",
            you: "את/ה"
        },
        en: {
            waiting_title: "Waiting for partner...",
            connected_title: "Connected!",
            code_label: "Session Code",
            share_instr: "Share this code with your partner:",
            partner: "Partner",
            status_waiting: "Waiting to join...",
            status_working: "Answering quiz...",
            status_done: "Done!",
            you: "You"
        }
    }[language];

    const handleCopy = () => {
        navigator.clipboard.writeText(sessionData.sessionId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const partnerName = myRole === 'A' ? sessionData.founderBName : sessionData.founderAName;
    const isPartnerConnected = !!partnerName;

    return (
        <div className="bg-white rounded-[2rem] shadow-xl border border-blue-100 p-6 mb-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Connection Status / Code */}
                <div className="flex-1 w-full">
                    {!isPartnerConnected ? (
                        <div className="space-y-3 text-center md:text-start">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-amber-500 font-black">
                                <Loader2 className="animate-spin" size={20} />
                                <span>{t.waiting_title}</span>
                            </div>
                            <p className="text-slate-400 text-sm font-bold">{t.share_instr}</p>
                            <div
                                onClick={handleCopy}
                                className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors group"
                            >
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t.code_label}</span>
                                    <p className="text-3xl font-black text-slate-700 tracking-widest font-mono">{sessionData.sessionId}</p>
                                </div>
                                <div className="bg-white p-2 rounded-lg shadow-sm text-slate-400 group-hover:text-[#324FA2] transition-colors">
                                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-green-50 p-4 rounded-2xl border border-green-100">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-green-800 text-lg">{t.connected_title}</h3>
                                <p className="text-green-600 font-medium text-sm">
                                    {t.you} & {partnerName}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Live Progress */}
                {isPartnerConnected && (
                    <div className="flex-1 w-full space-y-4">
                        <ProgressRow
                            label={t.you}
                            count={myRole === 'A' ? Object.keys(sessionData.answersA || {}).length : Object.keys(sessionData.answersB || {}).length}
                            color="bg-[#324FA2]"
                        />
                        <ProgressRow
                            label={partnerName}
                            count={myRole === 'A' ? Object.keys(sessionData.answersB || {}).length : Object.keys(sessionData.answersA || {}).length}
                            color="bg-[#E46B3F]"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

const ProgressRow = ({ label, count, color }: { label: string, count: number, color: string }) => {
    const total = 35; // Total questions
    const pct = Math.min(100, (count / total) * 100);

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>{label}</span>
                <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-500 ease-out`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}
