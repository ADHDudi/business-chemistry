import React from 'react';
import { Zap, Lightbulb, Info, Target, Brain, BrainCircuit } from 'lucide-react';
import { Persona, AICommunicationCoach, Language } from '../../types';
import { PersonaList } from './shared';
import { CollapsibleSection } from '../CollapsibleSection';

export interface YouTabProps {
  currentPersona: Persona;
  aiInsight: AICommunicationCoach | null;
  language: Language;
  t: any;
  colors: {
    bg: string;
    text: string;
    accent: string;
    from: string;
    to: string;
    shadow: string;
    border: string;
    glow: string;
  };
  adhdLens: boolean;
}

const YouTab: React.FC<YouTabProps> = ({ currentPersona, aiInsight, language, t, colors, adhdLens }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4" data-testid="tab-content-you">
      {/* 1. Basics */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
            <Info size={18} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.you_basics}</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-600 font-medium leading-relaxed text-lg">{currentPersona.description[language]}</p>
        </div>
      </div>

      {/* 2. Your Strengths (Pros) */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden">
        <div className="p-4 bg-green-50/50 border-b border-green-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-green-100 bg-white shadow-sm text-green-600">
            <Zap size={18} fill="currentColor" />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.you_strengths_title}</h3>
        </div>
        <div className="p-6 space-y-4">
          {aiInsight && (
            <p className={`text-lg font-black ${colors.text} leading-snug`}>{aiInsight.user_profile.superpower}</p>
          )}
          <PersonaList title="" items={currentPersona.strengths[language]} icon={null} />
        </div>
      </div>

      {/* 3. Your Blind Spots (Cons) */}
      {aiInsight && (
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden">
          <div className="p-4 bg-red-50/40 border-b border-red-100 flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-red-100 bg-white shadow-sm text-red-500">
              <Target size={18} />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.you_blind_spots_title}</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-base font-black text-slate-800 leading-snug">{aiInsight.user_profile.kryptonite}</p>
            {aiInsight.user_profile.challenges && aiInsight.user_profile.challenges.length > 0 && (
              <ul className="space-y-3">
                {aiInsight.user_profile.challenges.map((c, i) => (
                  <li key={i} className="bg-slate-50/60 rounded-2xl p-4 border border-slate-100">
                    <div className={`text-sm font-black ${colors.text} mb-1`}>{c.title}</div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">{c.description}</p>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-1">
                      <span className="text-slate-400">{language === 'he' ? 'צץ ב:' : 'Watch for:'}</span>
                      <span>{c.watch_for}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 4. Tips for Action */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm ${colors.text}`}>
            <Lightbulb size={18} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.you_tips_title}</h3>
        </div>
        <div className="p-6">
          <PersonaList title="" items={currentPersona.tips[language]} icon={null} />
        </div>
      </div>

      {/* Communication Challenge collapsible (ADHD) — only when lens is ON */}
      {adhdLens && (
        <CollapsibleSection
          title={t.report.your_challenge_title}
          icon={<Brain size={16} className="text-slate-500" />}
          isAdhd
          defaultOpen
        >
          <p className="text-slate-600 font-medium text-sm leading-relaxed pt-2">
            {currentPersona.communication_challenge[language]}
          </p>
        </CollapsibleSection>
      )}

      {/* ADHD Angle collapsible — only when lens is ON */}
      {adhdLens && (
        <CollapsibleSection
          title={t.report.adhd_title}
          icon={<BrainCircuit size={16} className="text-[#8c50f0]" />}
          isAdhd
          defaultOpen
        >
          <p className="text-white font-bold text-sm leading-relaxed italic pt-2 bg-slate-800 p-4 rounded-xl">
            {currentPersona.adhd_challenge[language]}
          </p>
        </CollapsibleSection>
      )}
    </div>
  );
};

export default YouTab;
