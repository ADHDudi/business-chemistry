
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Grid, List, Zap, Lightbulb, CheckCircle,
  BrainCircuit,
  ExternalLink, Copy, Star, Target, Hash,
  Sparkles, Globe, Brain, Loader2,
  ThumbsUp, ThumbsDown, Info, Send, RefreshCw,
  Terminal, X, Share2, Users,
  User as UserIcon
} from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import ConsultationMobile from './report/ConsultationMobile';
import { Language, User, Persona, AICommunicationCoach } from '../types';
import { getIconComponent as getIcon, SOCIAL_LINKS, PERSONA_DATA } from '../constants';
import { buildPayload, saveReport, sendFinalReport } from '../services/reportingService';
import { getAIInsights } from '../geminiService';
import { calculateResults, getPersona, computePersonaAffinities } from '../scoring';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebaseConfig';


interface ReportViewProps {
  user: User;
  answers: Record<number, number>;
  onReset: () => void;
  submitError: string | null;
  language: Language;
  t: any;
  forceDebug?: boolean;
}

const ReportView: React.FC<ReportViewProps> = ({ user, answers, onReset, submitError, language, t, forceDebug }) => {
  const [activeTab, setActiveTab] = useState<'you' | 'them' | 'together'>('you');
  const [adhdLens, setAdhdLens] = useState(false);
  // Auto-send replaces manual sending state
  const [aiInsight, setAiInsight] = useState<AICommunicationCoach | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [targetProfile, setTargetProfile] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<'positive' | 'negative' | 'refined' | null>(null);
  const [refinementText, setRefinementText] = useState('');
  const [clicks, setClicks] = useState({ website: false, schedule: false, socials: {} as Record<string, boolean> });
  const [isCopying, setIsCopying] = useState(false);

  // Debug & Sync State
  const [showDebug, setShowDebug] = useState(false);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const syncInProgress = useRef(false);

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

  const syncToSheet = useCallback(async (overrides: Record<string, unknown> = {}) => {
    if (syncInProgress.current && !overrides.isFinal) return;

    syncInProgress.current = true;
    setSyncStatus('syncing');

    const payload = buildPayload(
      user,
      { formal: avgFormal, dominant: avgDominant },
      currentPersona,
      language,
      answers,
      {
        aiInsight: aiInsight || "",
        aiFeedback: aiFeedback || "Pending",
        refinementReason: refinementText,
        clicks,
        ...overrides,
      }
    );

    setLastPayload(payload);

    try {
      await saveReport(payload);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      console.error("Sync error:", e);
      setSyncStatus('error');
    } finally {
      syncInProgress.current = false;
    }
  }, [user, avgFormal, avgDominant, currentPersona, aiInsight, aiFeedback, clicks, answers, language, refinementText]);

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
      let newState;
      if (type === 'website') newState = { ...prev, website: true };
      else if (type === 'schedule') newState = { ...prev, schedule: true };
      else newState = { ...prev, socials: { ...prev.socials, [type]: true } };

      syncToSheet({ clicks: newState });
      return newState;
    });
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setAiFeedback(type);
    syncToSheet({ aiFeedback: type });
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
          syncToSheet({ aiInsight: JSON.stringify(insight), isFinal: false });
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
    if (!refinementText.trim()) return;
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const insight = await getAIInsights(currentPersona, results, language, refinementText, targetProfile || undefined);
      if (!insight) throw new Error('No insight returned');
      setAiInsight(insight);
      setAiFeedback('refined');
      syncToSheet({ aiInsight: JSON.stringify(insight), aiFeedback: 'refined', refinementReason: refinementText });
    } catch (err: any) {
      setAiError(err.message || "Error during refinement.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Auto-send report on visibility change (close/switch tab)
  const hasSentFinalReport = useRef(false);
  const latestPayloadRef = useRef<any>(null);

  // Keep latestPayloadRef in sync for the visibilitychange keepalive send
  useEffect(() => {
    latestPayloadRef.current = buildPayload(
      user,
      { formal: avgFormal, dominant: avgDominant },
      currentPersona,
      language,
      answers,
      { aiInsight: aiInsight || "", aiFeedback: aiFeedback || "Pending", refinementReason: refinementText, clicks, isFinal: true }
    );
  }, [user, avgFormal, avgDominant, currentPersona, aiInsight, aiFeedback, clicks, answers, language, refinementText]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !hasSentFinalReport.current && latestPayloadRef.current) {
        hasSentFinalReport.current = true;
        sendFinalReport(latestPayloadRef.current).catch(err => console.error("Auto-send failed:", err));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    // pagehide is also good for mobile but visibilitychange 'hidden' is generally reliable
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
    };
  }, []);

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
              <span className={`px-2 py-0.5 rounded-full text-[8px] ${syncStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                Status: {syncStatus.toUpperCase()}
              </span>
            </h2>
            <button onClick={() => setShowDebug(false)} className="p-2 bg-slate-100 rounded-lg"><X size={14} /></button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-black text-slate-400 mb-1 border-b uppercase">Target Endpoint:</p>
              <p className="break-all text-blue-600 bg-slate-50 p-2 rounded">configured in reportingService.ts</p>
            </div>
            <div>
              <p className="font-black text-slate-400 mb-1 border-b uppercase">Last Payload Data (isFinal decision):</p>
              <pre className="bg-slate-50 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap border border-slate-200">
                {lastPayload ? JSON.stringify(lastPayload, null, 2) : "Syncing..."}
              </pre>
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
      )}

      {activeTab === 'them' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4" data-testid="tab-content-them">
          {/* Target Profile Selector */}
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center">
              {language === 'he' ? 'עם מי הפגישה?' : 'Who are you meeting?'}
            </h4>
            <div className="flex gap-2 min-w-max px-2">
              {['Guardian', 'Driver', 'Integrator', 'Pioneer'].map((p) => (
                <button
                  key={p}
                  onClick={() => setTargetProfile(p)}
                  data-testid={`persona-btn-${p.toLowerCase()}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    targetProfile === p
                      ? 'btn-gradient text-white shadow-md transform scale-105'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span>{p === 'Guardian' ? '🛡️' : p === 'Driver' ? '🎯' : p === 'Integrator' ? '🤝' : '🚀'}</span>
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoadingAI ? (
            <div className={`bg-white p-12 rounded-[2.5rem] shadow-sm border-2 ${colors.border} flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]`}>
              <div className="relative">
                <Brain size={48} className={`${colors.text} animate-bounce`} />
                <Loader2 size={24} className={`${colors.accent} animate-spin absolute -top-1 -right-1`} />
              </div>
              <h4 className={`text-lg font-black ${colors.text}`}>{language === 'he' ? 'בונה את תוכנת האימון...' : 'Building your coaching brief...'}</h4>
            </div>
          ) : aiInsight && targetProfile ? (
            <div className="space-y-4" data-testid="ai-loaded">
              {/* Common Ground */}
              {aiInsight.interaction_guide.common_ground && (
                <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden">
                  <div className="p-4 bg-green-50/50 border-b border-green-100 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-green-100 bg-white shadow-sm text-green-600">
                      <CheckCircle size={18} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.them_common_ground_title}</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-base text-slate-700 font-medium leading-relaxed">{aiInsight.interaction_guide.common_ground}</p>
                  </div>
                </div>
              )}

              {/* Their Drivers */}
              {aiInsight.interaction_guide.their_motivation && (
                <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden">
                  <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-blue-100 bg-white shadow-sm text-blue-500">
                      <Sparkles size={18} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.them_their_motivation_title}</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-base text-slate-700 font-medium leading-relaxed">{aiInsight.interaction_guide.their_motivation}</p>
                  </div>
                </div>
              )}

              {/* Motivation Gap */}
              {aiInsight.interaction_guide.motivation_gap && (
                <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden">
                  <div className="p-4 bg-yellow-50/50 border-b border-yellow-100 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-yellow-200 bg-white shadow-sm text-yellow-600">
                      <Hash size={18} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.them_motivation_gap_title}</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-base text-slate-700 font-medium leading-relaxed">{aiInsight.interaction_guide.motivation_gap}</p>
                  </div>
                </div>
              )}

              {/* Friction Point */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden">
                <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl border border-red-100 bg-white shadow-sm text-red-500">
                    <Zap size={18} />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.report.friction_title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-lg font-black text-slate-900 leading-relaxed mb-3">{aiInsight.interaction_guide.friction_point}</p>
                </div>
              </div>

              {/* Strategy Card */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
                  <Target size={18} className="text-green-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest">{t.report.strategy_title}</h3>
                </div>
                <div className="p-6 space-y-5">
                  <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                    <ContextIcon profile={targetProfile} />
                    {aiInsight.interaction_guide.strategy_card.action}
                  </h4>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
                    <span className="absolute -top-2 left-4 bg-slate-900 text-white text-[9px] font-bold px-3 py-1 rounded uppercase">💬 Script</span>
                    <p className="text-lg text-slate-800 italic font-bold leading-relaxed mt-2">"{aiInsight.interaction_guide.strategy_card.script}"</p>
                  </div>
                </div>
              </div>

              {/* ADHD Hack — only shown when ADHD lens is ON */}
              {adhdLens && (
                <CollapsibleSection
                  title={t.report.adhd_hack_title}
                  icon={<BrainCircuit size={16} className="text-[#8c50f0]" />}
                  isAdhd
                  defaultOpen
                >
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-black text-slate-800">{aiInsight.executive_function_tool.tool_name}</h3>
                    <p className="text-slate-600 font-medium text-sm">{aiInsight.executive_function_tool.instruction}</p>
                    {aiInsight.executive_function_tool.template_ready && (
                      <button className="w-full py-3 bg-[#f3ecff] text-[#8c50f0] font-black rounded-xl text-sm hover:bg-[#e4d7ff] transition-colors flex items-center justify-center gap-2">
                        <span>📝</span>
                        {language === 'he' ? 'פתח דף טיוטה (Parking Lot)' : 'Open Parking Lot Widget'}
                      </button>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Feedback row */}
              <div className="px-6 pb-6 pt-2 flex flex-col items-center gap-4">
                {aiFeedback === 'positive' || aiFeedback === 'refined' ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-6 py-2 rounded-full border border-green-100">
                    <CheckCircle size={16} />
                    <span className="text-[11px] font-black uppercase tracking-tight">
                      {language === 'he' ? 'התוצאה אושרה - תודה!' : 'Result approved'}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button onClick={() => handleFeedback('positive')} className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-200 text-slate-500 hover:bg-green-50 hover:text-green-600 transition-all">
                      <ThumbsUp size={16} /> <span className="text-xs font-black">Helpful</span>
                    </button>
                    <button onClick={() => setAiFeedback('negative')} className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
                      <ThumbsDown size={16} /> <span className="text-xs font-black">Not Helpful</span>
                    </button>
                  </div>
                )}
                {aiFeedback === 'negative' && (
                  <div className="w-full space-y-2">
                    <textarea
                      value={refinementText}
                      onChange={e => setRefinementText(e.target.value)}
                      placeholder={language === 'he' ? 'מה לשפר?' : 'What should be improved?'}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#8c50f0]/30"
                      rows={2}
                    />
                    <button
                      onClick={regenerateWithFeedback}
                      disabled={!refinementText.trim()}
                      className="w-full py-2 bg-[#8c50f0] text-white font-black rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> {language === 'he' ? 'שפר ניתוח' : 'Refine Analysis'}
                    </button>
                  </div>
                )}
                <button onClick={handleShare} className="text-slate-400 text-sm font-bold flex items-center gap-2 hover:text-slate-600">
                  <Share2 size={14} /> Share Brief
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-8 rounded-[2.5rem] text-center space-y-4 border border-slate-200" data-testid="ai-error">
              {aiError ? (
                <>
                  <p className="text-red-500 font-bold">AI Request Failed: {aiError}</p>
                  <p className="text-slate-400 text-sm">Please check the console or ensure your API key is correctly configured.</p>
                </>
              ) : (
                <p className="text-slate-400 font-medium">{language === 'he' ? 'בחר פרופיל כדי להתחיל' : 'Select a profile above to get your coaching brief'}</p>
              )}
              {aiError && (
                <button
                  onClick={() => {
                    lastFetchRef.current = { personaKey: null, targetProfile: undefined };
                    setAiInsight(null);
                    setAiError(null);
                  }}
                  className="px-6 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Retry Analysis
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'together' && (
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
          <div className={`bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden transition-all duration-700`}>
            <div className={`p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3`}>
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
                  className={`absolute w-10 h-10 rounded-full border-4 border-white shadow-2xl brand-gradient transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 transition-all duration-1000 ease-out ring-4 ring-white/50`}
                  style={{ left: `${positionX}%`, top: `${positionY}%` }}
                >
                  <Star size={16} className="text-white animate-pulse" fill="white" />
                </div>
              </div>
            </div>
          </div>
        </div>
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

function PersonaList({ title, items, icon }: { title: string, items: string[], icon: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {title && <h4 className="flex items-center gap-2 font-black text-slate-800 text-lg tracking-tight">{icon} {title}</h4>}
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-base text-slate-600 font-medium leading-relaxed">
            <div className="mt-2 w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}


function SocialIcon(_props: any) {
  return null;
}


function ContextIcon({ profile }: { profile: string | null }) {
  if (!profile) return <Users size={18} className="text-slate-400" />;
  if (profile === 'Guardian') return <span className="text-lg">🛡️</span>;
  if (profile === 'Driver') return <span className="text-lg">🎯</span>;
  if (profile === 'Integrator') return <span className="text-lg">🤝</span>;
  return <span className="text-lg">🚀</span>;
}

export default ReportView;