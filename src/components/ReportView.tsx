
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Grid, BrainCircuit,
  Target, Sparkles, Globe,
  Terminal, X,
  User as UserIcon
} from 'lucide-react';
import ConsultationMobile from './report/ConsultationMobile';
import YouTab from './report/YouTab';
import ThemTab, { FeedbackStatus } from './report/ThemTab';
import TogetherTab from './report/TogetherTab';
import { Language, User, Persona, AICommunicationCoach } from '../types';
import { getIconComponent as getIcon, SOCIAL_LINKS } from '../constants';
import { getAIInsights } from '../geminiService';
import { saveInsightFeedback } from '../services/reportingService';
import { calculateResults, getPersona, computePersonaAffinities } from '../scoring';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebaseConfig';


interface ReportViewProps {
  user: User;
  answers: Record<number, number>;
  onReset: () => void;
  submitError: string | null;
  uid: string | null;
  reportId: string | null;
  language: Language;
  t: any;
  forceDebug?: boolean;
}

const ReportView: React.FC<ReportViewProps> = ({ user, answers, onReset, submitError, uid, reportId, language, t, forceDebug }) => {
  const [activeTab, setActiveTab] = useState<'you' | 'them' | 'together'>('you');
  const [adhdLens, setAdhdLens] = useState(false);
  // Auto-send replaces manual sending state
  const [aiInsight, setAiInsight] = useState<AICommunicationCoach | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [targetProfile, setTargetProfile] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>('idle');
  const [clicks, setClicks] = useState({ website: false, schedule: false, socials: {} as Record<string, boolean> });
  const [isCopying, setIsCopying] = useState(false);

  const [showDebug, setShowDebug] = useState(false);

  const results = useMemo(() => calculateResults(answers), [answers]);
  const { profileData, formal: avgFormal, dominant: avgDominant } = results;
  const currentPersona = useMemo(() => getPersona(avgFormal, avgDominant), [avgFormal, avgDominant]);
  const affinities = useMemo(
    () => computePersonaAffinities(parseFloat(avgFormal), parseFloat(avgDominant)),
    [avgFormal, avgDominant]
  );

  const isDudiMode = user.email.trim().toLowerCase() === 'tsur.david@gmail.com' || forceDebug;

  const colors = {
    red: { bg: 'bg-red-50', text: 'text-red-700', accent: 'text-red-400', from: 'from-red-500', to: 'to-red-700', shadow: 'shadow-red-500/20', border: 'border-red-200', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]' },
    green: { bg: 'bg-green-50', text: 'text-green-700', accent: 'text-green-400', from: 'from-green-500', to: 'to-green-700', shadow: 'shadow-green-500/20', border: 'border-green-200', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', accent: 'text-yellow-400', from: 'from-yellow-400', to: 'to-yellow-600', shadow: 'shadow-yellow-500/20', border: 'border-yellow-200', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', accent: 'text-blue-400', from: 'from-blue-500', to: 'to-blue-700', shadow: 'shadow-blue-500/20', border: 'border-blue-200', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' }
  }[currentPersona.color];


  const trackClick = (type: 'website' | 'schedule' | string) => {
    // Log to Google Analytics
    logEvent(analytics, 'link_click', {
      link_type: type,
      link_url: type === 'website' ? SOCIAL_LINKS.website
        : type === 'schedule' ? 'https://app.magicalhq.com/dudi-adhdotech/_Mentoring_with_Dudido'
          : (SOCIAL_LINKS as any)[type] || type,
      persona: currentPersona.key,
      user_name: user.name
    });

    setClicks(prev => {
      if (type === 'website') return { ...prev, website: true };
      if (type === 'schedule') return { ...prev, schedule: true };
      return { ...prev, socials: { ...prev.socials, [type]: true } };
    });
  };

  const submitFeedback = async () => {
    if (!uid || !reportId || feedbackRating < 1) return;
    setFeedbackStatus('saving');
    try {
      await saveInsightFeedback(uid, reportId, {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        insight: aiInsight,
        targetProfile,
      });
      setFeedbackStatus('saved');
    } catch (err) {
      console.error('Failed to save AI insight feedback:', err);
      setFeedbackStatus('error');
    }
  };

  const handleShare = async () => {
    if (!aiInsight) return;
    // Format JSON for sharing as text
    const shareText = `${currentPersona.title[language]}\n\n` +
      `🚀 Superpower: ${aiInsight.user_profile.superpower}\n` +
      `⚠️ Challenge: ${aiInsight.interaction_guide.friction_point}\n` +
      `💡 Tip: ${aiInsight.interaction_guide.strategy_card.action}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `ADHDudi - ${currentPersona.title[language]}`,
          text: shareText,
          url: SOCIAL_LINKS.website
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
      } catch (err) {
        console.error('Error copying:', err);
      }
    }
  };

  const lastFetchRef = useRef<{ personaKey: string | null, targetProfile: string | null | undefined }>({ personaKey: null, targetProfile: undefined });

  useEffect(() => {
    const initAI = async () => {
      // If we already have insights and the target hasn't changed, don't regenerate
      if (
        lastFetchRef.current.personaKey === currentPersona.key &&
        lastFetchRef.current.targetProfile === targetProfile &&
        aiInsight !== null
      ) {
        return;
      }

      if (isLoadingAI) return;

      setIsLoadingAI(true);
      setAiError(null);
      try {
        const insight = await getAIInsights(currentPersona, results, language, undefined, targetProfile || undefined);
        if (insight) {
          setAiInsight(insight);
          lastFetchRef.current = { personaKey: currentPersona.key, targetProfile };
        } else {
          setAiError("Failed to generate insights from the AI provider.");
        }
      } catch (err: any) {
        console.error(err);
        setAiError(err.message || "An unexpected error occurred while contacting AI.");
      } finally {
        setIsLoadingAI(false);
      }
    };
    initAI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersona, results, language, targetProfile]);

  const regenerateWithFeedback = async () => {
    if (!feedbackComment.trim()) return;
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const insight = await getAIInsights(currentPersona, results, language, feedbackComment.trim(), targetProfile || undefined);
      if (!insight) throw new Error('No insight returned');
      setAiInsight(insight);
      // The refined insight is new — let the user rate it afresh
      setFeedbackRating(0);
      setFeedbackComment('');
      setFeedbackStatus('idle');
    } catch (err: any) {
      setAiError(err.message || "Error during refinement.");
    } finally {
      setIsLoadingAI(false);
    }
  };



  const positionX = 15 + ((parseFloat(avgDominant) - 1) / 5) * 70;
  const positionY = 15 + ((6 - parseFloat(avgFormal)) / 5) * 70;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 relative">
      {/* Debug Trigger (Floating High-Contrast Icon for Dudi) */}
      {isDudiMode && (
        <button
          onClick={() => setShowDebug(true)}
          className="fixed bottom-6 right-6 z-[60] bg-[#8c50f0] text-white p-4 rounded-full shadow-2xl active:scale-95 ring-4 ring-white border border-[#6a2dd0] transition-transform hover:scale-110"
        >
          <Terminal size={24} />
        </button>
      )}

      {/* Debug Overlay */}
      {showDebug && (
        <div className="fixed inset-0 z-[100] bg-white p-6 overflow-y-auto font-mono text-[10px]" dir="ltr">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 border-b">
            <h2 className="text-sm font-black flex items-center gap-2">
              <Terminal size={14} /> DEBUG CONSOLE
            </h2>
            <button onClick={() => setShowDebug(false)} className="p-2 bg-slate-100 rounded-lg"><X size={14} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="font-black text-slate-400 mb-1 border-b uppercase">Data Store:</p>
              <p className="break-all text-blue-600 bg-slate-50 p-2 rounded">Firestore — users/&#123;uid&#125;/reports</p>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-white p-6 rounded-[2.5rem] shadow-xl border-2 ${colors.border} text-center`}>
        <div className="inline-block p-4 rounded-3xl bg-slate-50 mb-4">{getIcon(currentPersona.icon, 48, colors.text)}</div>
        <h2 className="text-3xl font-black text-slate-900 leading-tight">{t.report.greeting} {user.name}</h2>
        <p className={`text-lg font-black ${colors.text}`}>{currentPersona.title[language]}</p>
      </div>

      {/* ADHD Lens chip */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setAdhdLens(v => !v)}
          aria-pressed={adhdLens}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black tracking-widest uppercase transition-all border ${
            adhdLens
              ? 'bg-[#8c50f0] text-white border-transparent shadow-md'
              : 'bg-white text-slate-500 border-slate-200 hover:border-[#8c50f0]/40'
          }`}
        >
          <BrainCircuit size={14} />
          {t.report.adhd_lens_label}
          <span className={`text-[9px] px-2 py-0.5 rounded-full ${adhdLens ? 'bg-white/20' : 'bg-slate-100'}`}>
            {adhdLens ? t.report.adhd_lens_on : t.report.adhd_lens_off}
          </span>
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex bg-slate-100 p-1 rounded-2xl no-select">
        {(['you', 'them', 'together'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            data-testid={`tab-${tab}`}
            className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
              activeTab === tab ? 'bg-[#8c50f0] text-white shadow-md' : 'text-slate-500'
            }`}
          >
            {tab === 'you' && <UserIcon size={14} />}
            {tab === 'them' && <Target size={14} />}
            {tab === 'together' && <Grid size={14} />}
            <span>{t.report.tabs[tab]}</span>
          </button>
        ))}
      </div>

      {activeTab === 'you' && (
        <YouTab
          currentPersona={currentPersona}
          aiInsight={aiInsight}
          language={language}
          t={t}
          colors={colors}
          adhdLens={adhdLens}
        />
      )}

      {activeTab === 'them' && (
        <ThemTab
          currentPersona={currentPersona}
          aiInsight={aiInsight}
          isLoadingAI={isLoadingAI}
          aiError={aiError}
          feedbackRating={feedbackRating}
          feedbackComment={feedbackComment}
          feedbackStatus={reportId ? feedbackStatus : 'unavailable'}
          targetProfile={targetProfile}
          language={language}
          t={t}
          colors={colors}
          adhdLens={adhdLens}
          onTargetProfileChange={setTargetProfile}
          onRatingChange={setFeedbackRating}
          onCommentChange={setFeedbackComment}
          onFeedbackSubmit={submitFeedback}
          onRefinementSubmit={regenerateWithFeedback}
          onShare={handleShare}
          onRetry={() => {
            lastFetchRef.current = { personaKey: null, targetProfile: undefined };
            setAiInsight(null);
            setAiError(null);
          }}
        />
      )}

      {activeTab === 'together' && (
        <TogetherTab
          affinities={affinities}
          currentPersona={currentPersona}
          aiInsight={aiInsight}
          positionX={positionX}
          positionY={positionY}
          language={language}
          t={t}
          colors={colors}
        />
      )}

      <ConsultationMobile persona={currentPersona} colors={colors} language={language} t={t} onTrack={trackClick} showAdhd={adhdLens} />

      <div className="flex flex-col gap-2 no-select">
        <div className="flex gap-2">
          {/* Auto-send is handled on visibility change, no manual button needed */}

        </div>
        {submitError && <p className="text-red-500 text-xs text-center font-bold">{submitError}</p>}

        <button onClick={onReset} className="w-full py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-600 transition-colors">{t.report.restart_btn}</button>
      </div>
    </div>
  );
};


export default ReportView;