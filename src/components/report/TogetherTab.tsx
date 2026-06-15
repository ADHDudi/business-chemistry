import React from 'react';
import { Grid, Hash, Sparkles, Star } from 'lucide-react';
import { Persona, AICommunicationCoach, Language } from '../../types';
import { PERSONA_DATA } from '../../constants';

export interface TogetherTabProps {
  affinities: Array<{ key: string; affinity: number }>;
  currentPersona: Persona;
  aiInsight: AICommunicationCoach | null;
  positionX: number;
  positionY: number;
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
}

const TogetherTab: React.FC<TogetherTabProps> = ({
  affinities,
  currentPersona,
  aiInsight,
  positionX,
  positionY,
  language,
  t,
  colors,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6" data-testid="tab-content-together">
      {/* Persona Resonance — quantified closeness to each persona */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
            <Hash size={18} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.together_resonance_title}</h3>
        </div>
        <div className="p-6 space-y-4" data-testid="resonance-bars">
          {affinities.map(({ key, affinity }) => {
            const persona = PERSONA_DATA[key];
            const isTop = key === currentPersona.key;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${isTop ? 'text-[#8c50f0]' : 'text-slate-600'}`}>
                    {persona.title[language]}
                  </span>
                  <span className={`text-sm font-black tabular-nums ${isTop ? 'text-[#8c50f0]' : 'text-slate-500'}`}>
                    {affinity}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${isTop ? 'brand-gradient' : 'bg-slate-300'}`}
                    style={{ width: `${affinity}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Position Narrative */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
            <Sparkles size={18} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.together_narrative_title}</h3>
        </div>
        <div className="p-6">
          <p className="text-base text-slate-700 font-medium leading-relaxed">
            {aiInsight?.position_narrative
              ?? (language === 'he'
                ? `הכי קרוב ל-${PERSONA_DATA[affinities[0].key].title.he} (${affinities[0].affinity}%).`
                : `Closest to ${PERSONA_DATA[affinities[0].key].title.en} (${affinities[0].affinity}%).`)}
          </p>
        </div>
      </div>

      {/* Matrix Visualization */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden transition-all duration-700">
        <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
            <Grid size={18} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.matrix_title}</h3>
        </div>

        <div className="p-5 aspect-square relative overflow-hidden">
          <div className="relative w-full h-full border-2 border-slate-100 rounded-2xl bg-white overflow-hidden" dir="ltr">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-10 pointer-events-none">
              <div className="bg-blue-400 border-r border-b border-slate-200" />
              <div className="bg-red-400 border-b border-slate-200" />
              <div className="bg-green-400 border-r border-slate-200" />
              <div className="bg-yellow-400" />
            </div>
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none p-4">
              <div className="flex items-center justify-center text-center">
                <span className={`text-[10px] font-black uppercase leading-tight ${currentPersona.key === 'GUARDIAN' ? 'text-blue-900 opacity-100 scale-110' : 'text-blue-900/40'}`} dir={language === 'he' ? 'rtl' : 'ltr'}>
                  {PERSONA_DATA.GUARDIAN.title[language]}
                </span>
              </div>
              <div className="flex items-center justify-center text-center">
                <span className={`text-[10px] font-black uppercase leading-tight ${currentPersona.key === 'DRIVER' ? 'text-red-900 opacity-100 scale-110' : 'text-red-900/40'}`} dir={language === 'he' ? 'rtl' : 'ltr'}>
                  {PERSONA_DATA.DRIVER.title[language]}
                </span>
              </div>
              <div className="flex items-center justify-center text-center">
                <span className={`text-[10px] font-black uppercase leading-tight ${currentPersona.key === 'INTEGRATOR' ? 'text-green-900 opacity-100 scale-110' : 'text-green-900/40'}`} dir={language === 'he' ? 'rtl' : 'ltr'}>
                  {PERSONA_DATA.INTEGRATOR.title[language]}
                </span>
              </div>
              <div className="flex items-center justify-center text-center">
                <span className={`text-[10px] font-black uppercase leading-tight ${currentPersona.key === 'PIONEER' ? 'text-yellow-900 opacity-100 scale-110' : 'text-yellow-900/40'}`} dir={language === 'he' ? 'rtl' : 'ltr'}>
                  {PERSONA_DATA.PIONEER.title[language]}
                </span>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-0.5 bg-slate-300 opacity-30" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-0.5 bg-slate-300 opacity-30" />
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10" dir={language === 'he' ? 'rtl' : 'ltr'}>
              {t.report.labels.formal}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10" dir={language === 'he' ? 'rtl' : 'ltr'}>
              {t.report.labels.informal}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 origin-right text-[9px] font-black text-slate-400 uppercase tracking-widest z-10" dir={language === 'he' ? 'rtl' : 'ltr'}>
              {t.report.labels.dominant}
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[9px] font-black text-slate-400 uppercase tracking-widest z-10" dir={language === 'he' ? 'rtl' : 'ltr'}>
              {t.report.labels.passive}
            </div>
            <div
              className="absolute w-10 h-10 rounded-full border-4 border-white shadow-2xl brand-gradient transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 transition-all duration-1000 ease-out ring-4 ring-white/50"
              style={{ left: `${positionX}%`, top: `${positionY}%` }}
            >
              <Star size={16} className="text-white animate-pulse" fill="white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TogetherTab;
