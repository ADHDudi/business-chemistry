import React from 'react';
import { BrainCircuit, Sparkles, Globe } from 'lucide-react';
import { Language, Persona } from '../../types';
import { SOCIAL_LINKS } from '../../constants';

interface ConsultationMobileProps {
  persona: Persona;
  colors: any;
  language: Language;
  t: any;
  onTrack: (type: string) => void;
  showAdhd?: boolean;
}

function ConsultationMobile({ persona, colors, language, t, onTrack, showAdhd }: ConsultationMobileProps) {
  const cta = t.report.cta;
  return (
    <div className="bg-slate-900 p-4 sm:p-8 rounded-[2.5rem] text-white space-y-4 sm:space-y-8 shadow-2xl overflow-hidden relative border border-white/5" data-testid="consultation-mobile">
      <div className="absolute top-0 left-0 right-0 h-[3px] brand-gradient" />
      <div className="space-y-4 relative z-10">
        {showAdhd && (
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/5 text-purple-300`}>
              <BrainCircuit size={12} /> ADHD Insight
            </span>
          </div>
        )}

        <div className="space-y-3">
          <h3 className={`text-2xl font-black leading-tight text-purple-300`}>{cta.title}</h3>

          {showAdhd && (
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              {persona.communication_challenge[language]}
            </p>
          )}

          {showAdhd && (
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-2">
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${colors.accent}`}>{t.report.adhd_title}</h4>
              <p className="text-white font-bold text-sm leading-relaxed italic">
                {persona.adhd_challenge[language]}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={`bg-[#8c50f0]/15 p-4 rounded-2xl border border-white/5 relative z-10`}>
        <p className="text-xs text-slate-200 font-bold flex gap-2">
          <Sparkles size={16} className={`fill-purple-300 text-purple-300 shrink-0`} /> {persona.consultation_benefit[language]}
        </p>
      </div>

      <div className="space-y-4 relative z-10">
        <a
          href="https://app.magicalhq.com/dudi-adhdotech/_Mentoring_with_Dudido" target="_blank" rel="noopener noreferrer"
          onClick={() => onTrack('schedule')}
          className={`w-full py-5 brand-gradient text-white rounded-2xl font-black text-xl text-center block shadow-[0_6px_16px_rgba(140,80,240,0.20)] active:scale-95 transition-all duration-300 group`}
        >
          <span className="group-hover:scale-105 inline-block transition-transform">{cta.btn}</span>
        </a>

        <a
          href={SOCIAL_LINKS.website} target="_blank" rel="noopener noreferrer"
          onClick={() => onTrack('website')}
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors py-2 text-sm font-bold border-b border-transparent hover:border-slate-700"
        >
          <Globe size={16} />
          {cta.more_details}
        </a>
      </div>


      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.from}/10 rounded-full blur-3xl -mr-10 -mt-10`} />
    </div>
  );
}

export default ConsultationMobile;
