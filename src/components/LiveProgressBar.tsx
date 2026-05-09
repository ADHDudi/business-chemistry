import React from 'react';
import { AxisType, Trait, Language } from '../types';

interface LiveProgressBarProps {
  myProgress: number;
  partnerProgress: number;
  totalQuestions: number;
  partnerName: string;
  language: Language;
}

export default function LiveProgressBar({ 
  myProgress, 
  partnerProgress, 
  totalQuestions, 
  partnerName,
  language 
}: LiveProgressBarProps) {
  
  const myPercent = Math.min(100, (myProgress / totalQuestions) * 100);
  const partnerPercent = Math.min(100, (partnerProgress / totalQuestions) * 100);

  const t = {
    he: {
      you: "ההתקדמות שלך",
      partner: `ההתקדמות של ${partnerName || 'השותף/ה'}`
    },
    en: {
      you: "Your Progress",
      partner: `${partnerName || 'Partner'}'s Progress`
    }
  }[language];

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 p-4 sticky top-[73px] z-40 shadow-sm space-y-3">
      {/* My Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-black uppercase tracking-wider text-[#8c50f0]">
          <span>{t.you}</span>
          <span>{Math.round(myPercent)}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#a014f0] via-[#5078ff] to-[#3cdcf0] transition-all duration-500 ease-out"
            style={{ width: `${myPercent}%` }} 
          />
        </div>
      </div>

      {/* Partner Progress */}
      <div className="space-y-1 opacity-90">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>{t.partner}</span>
          <span>{Math.round(partnerPercent)}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-400 transition-all duration-500 ease-out" 
            style={{ width: `${partnerPercent}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
