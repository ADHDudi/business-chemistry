
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Grid, List, Zap, Lightbulb, CheckCircle,
  BrainCircuit, Youtube, Facebook,
  ExternalLink, Copy, Star, Target, Hash,
  Sparkles, Linkedin, Globe, Brain, Loader2,
  ThumbsUp, ThumbsDown, Info, Send, RefreshCw,
  Terminal, X, Share2, Users
} from 'lucide-react';
import { Language, User, Results, Persona, AxisType, Trait, AICommunicationCoach } from '../types';
import { getIconComponent as getIcon, SOCIAL_LINKS, GOOGLE_SCRIPT_URL, PERSONA_DATA, APP_ID } from '../constants';
import { getAIInsights } from '../geminiService';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebaseConfig';

interface ReportViewProps {
  user: User;
  answers: Record<number, number>;
  onReset: () => void;

  submitError: string | null;
  language: Language;
  t: any;
  calculateResults: (a: Record<number, number>) => Results;
  getPersona: (f: string, d: string) => Persona;
  forceDebug?: boolean;
}

const ReportView: React.FC<ReportViewProps> = ({ user, answers, onReset, submitError, language, t, calculateResults, getPersona, forceDebug }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'ai' | 'prepare'>('overview');
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

  const isDudiMode = user.email.trim().toLowerCase() === 'tsur.david@gmail.com' || forceDebug;

  const colors = {
    red: { bg: 'bg-red-50', text: 'text-red-700', accent: 'text-red-400', from: 'from-red-500', to: 'to-red-700', shadow: 'shadow-red-500/20', border: 'border-red-200', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]' },
    green: { bg: 'bg-green-50', text: 'text-green-700', accent: 'text-green-400', from: 'from-green-500', to: 'to-green-700', shadow: 'shadow-green-500/20', border: 'border-green-200', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', accent: 'text-yellow-400', from: 'from-yellow-400', to: 'to-yellow-600', shadow: 'shadow-yellow-500/20', border: 'border-yellow-200', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', accent: 'text-blue-400', from: 'from-blue-500', to: 'to-blue-700', shadow: 'shadow-blue-500/20', border: 'border-blue-200', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' }
  }[currentPersona.color];

  const syncToSheet = useCallback(async (overrides: Record<string, any> = {}) => {
    if (!GOOGLE_SCRIPT_URL || (syncInProgress.current && !overrides.isFinal)) return;

    syncInProgress.current = true;
    setSyncStatus('syncing');

    const payload = {
      appId: APP_ID,
      user,
      scores: { formal: avgFormal, dominant: avgDominant },
      personaKey: currentPersona.key,
      personaTitle: currentPersona.title[language],
      personaDetails: {
        strengths: currentPersona.strengths[language].join('; '),
        tips: currentPersona.tips[language].join('; '),
        adhd_challenge: currentPersona.adhd_challenge[language],
        communication_challenge: currentPersona.communication_challenge[language],
        consultation_benefit: currentPersona.consultation_benefit[language]
      },
      aiInsight: overrides.aiInsight !== undefined ? overrides.aiInsight : (aiInsight || ""),
      aiFeedback: overrides.aiFeedback !== undefined ? overrides.aiFeedback : (aiFeedback || "Pending"),
      refinementReason: overrides.refinementReason !== undefined ? overrides.refinementReason : refinementText,
      clicks: overrides.clicks !== undefined ? overrides.clicks : clicks,
      answers,
      language,
      isFinal: overrides.isFinal || false,
      timestamp: new Date().toISOString()
    };

    setLastPayload(payload);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
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

  // Update ref with latest data whenever it changes
  useEffect(() => {
    latestPayloadRef.current = {
      appId: APP_ID,
      user,
      scores: { formal: avgFormal, dominant: avgDominant },
      personaKey: currentPersona.key,
      personaTitle: currentPersona.title[language],
      personaDetails: {
        strengths: currentPersona.strengths[language].join('; '),
        tips: currentPersona.tips[language].join('; '),
        adhd_challenge: currentPersona.adhd_challenge[language],
        communication_challenge: currentPersona.communication_challenge[language],
        consultation_benefit: currentPersona.consultation_benefit[language]
      },
      aiInsight: aiInsight || "",
      aiFeedback: aiFeedback || "Pending",
      refinementReason: refinementText,
      clicks: clicks,
      answers,
      language,
      isFinal: true,
      timestamp: new Date().toISOString()
    };
  }, [user, avgFormal, avgDominant, currentPersona, aiInsight, aiFeedback, clicks, answers, language, refinementText]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !hasSentFinalReport.current && latestPayloadRef.current && GOOGLE_SCRIPT_URL) {
        hasSentFinalReport.current = true;

        // Use fetch with keepalive as a modern alternative to sendBeacon
        fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          keepalive: true,
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(latestPayloadRef.current)
        }).catch(err => console.error("Auto-send failed:", err));
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

  const tabLabels = {
    overview: language === 'he' ? 'סקירה' : 'Overview',
    ai: language === 'he' ? 'ניתוח AI' : 'AI Analysis',
    matrix: t.report.tabs.matrix,
    prepare: language === 'he' ? 'התכן לפגישה' : 'Prepare for Meeting'
  };

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
              <p className="break-all text-blue-600 bg-slate-50 p-2 rounded">{GOOGLE_SCRIPT_URL}</p>
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

      <div className="flex bg-slate-100 p-1 rounded-2xl no-select">
        {(['overview', 'ai', 'prepare', 'matrix'] as const).map(tab => (
          <button
            key={tab} onClick={() => setActiveTab(tab)}
            data-testid={`tab-${tab}`}
            className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${activeTab === tab ? `bg-[#8c50f0] text-white shadow-md` : 'text-slate-500'}`}
          >
            {tab === 'overview' && <Info size={14} className={activeTab === tab ? 'text-white' : 'text-slate-500'} />}
            {tab === 'ai' && <BrainCircuit size={14} className={activeTab === tab ? 'text-white' : 'text-slate-500'} />}
            {tab === 'prepare' && <Target size={14} className={activeTab === tab ? 'text-white' : 'text-slate-500'} />}
            {tab === 'matrix' && <Grid size={14} className={activeTab === tab ? 'text-white' : 'text-slate-500'} />}
            <span>{tabLabels[tab]}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6" data-testid="tab-content-overview">
          <div className={`bg-white rounded-[2.5rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden transition-all duration-700`}>
            <div className={`p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3`}>
              <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
                <Info size={18} />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {language === 'he' ? 'סיכום הפרופיל' : 'Profile Summary'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-slate-600 font-medium leading-relaxed text-lg">{currentPersona.description[language]}</p>
              <PersonaList title={t.report.strengths_title} items={currentPersona.strengths[language]} icon={<Zap size={18} className="text-yellow-500" />} />
              <PersonaList title={t.report.tips_title} items={currentPersona.tips[language]} icon={<Lightbulb size={18} className={colors.text} />} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6" data-testid="tab-content-ai">
          {/* Card 1: The Vibe Check (Profile) */}
          {aiInsight && (
            <div className={`bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden`}>
              <div className={`p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3`}>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
                  <Zap size={18} />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{language === 'he' ? '1. כוח העל שלך' : '1. Your Superpower'}</h3>
              </div>
              <div className="p-6 text-center space-y-4">
                <h2 className={`text-2xl font-black ${colors.text}`}>{aiInsight.user_profile.superpower}</h2>
                <p className="text-slate-600 font-medium leading-relaxed">{language === 'he' ? 'המוח שלך הוא מנוע חדשנות.' : 'Your brain is an innovation engine.'}</p>
                <div className="inline-block px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-400">
                  VS Kryptonite: {aiInsight.user_profile.kryptonite}
                </div>
              </div>
              {aiInsight.user_profile.challenges && aiInsight.user_profile.challenges.length > 0 && (
                <div className="px-6 pb-6 pt-2 space-y-3 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-4">
                    {language === 'he' ? 'אתגרים מרכזיים' : 'Key Challenges'}
                  </h4>
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
                </div>
              )}
            </div>
          )}

          {isLoadingAI ? (
            <div className={`bg-white p-12 rounded-[2.5rem] shadow-sm border-2 ${colors.border} flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]`}>
              <div className="relative">
                <Brain size={48} className={`${colors.text} animate-bounce transition-colors duration-500`} />
                <div className={`absolute -inset-2 rounded-full ${colors.bg} opacity-20 animate-ping`} />
                <Loader2 size={24} className={`${colors.accent} animate-spin absolute -top-1 -right-1`} />
              </div>
              <div className="space-y-2">
                <h4 className={`text-lg font-black ${colors.text}`}>{language === 'he' ? 'בונה את תוכנת האימון...' : 'Building your coaching brief...'}</h4>
                <p className="text-slate-400 text-sm font-medium">{language === 'he' ? 'מתאים את האסטרטגיה לפרופיל הנבחר' : 'Tailoring strategy to the selected profile'}</p>
              </div>
            </div>
          ) : aiInsight ? (
            <div className="space-y-6" data-testid="ai-loaded">
              {/* Card 2: The Game Plan (Interaction) */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-[3px] brand-gradient" />
                <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
                  <Target size={18} className="text-green-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest">{language === 'he' ? '2. תוכנית משחק' : '2. Game Plan'}</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <h4 className="text-[10px] font-black uppercase text-red-400 mb-1">{language === 'he' ? 'נקודת חיכוך' : 'Friction Point'}</h4>
                    <p className="text-red-900 font-bold text-sm">{aiInsight.interaction_guide.friction_point}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 flex items-center gap-2">
                      <ContextIcon profile={targetProfile} />
                      {aiInsight.interaction_guide.strategy_card.action}
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
                      <span className="absolute -top-2 left-4 bg-slate-200 text-[9px] font-bold px-2 py-0.5 rounded text-slate-500 uppercase">Script</span>
                      <p className="text-slate-600 italic font-medium">"{aiInsight.interaction_guide.strategy_card.script}"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Executive Function Tool */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden relative">
                <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
                    <BrainCircuit size={18} />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{language === 'he' ? '3. כלי לניהול אימפולסיביות' : '3. ADHD Hack'}</h3>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-black text-slate-800">{aiInsight.executive_function_tool.tool_name}</h3>
                  <p className="text-slate-600 font-medium text-sm">{aiInsight.executive_function_tool.instruction}</p>

                  {aiInsight.executive_function_tool.template_ready && (
                    <button className="w-full py-3 bg-[#f3ecff] text-[#8c50f0] font-black rounded-xl text-sm hover:bg-[#e4d7ff] transition-colors flex items-center justify-center gap-2">
                      <span>📝</span>
                      {language === 'he' ? 'פתח דף טיוטה (Parking Lot)' : 'Open Parking Lot Widget'}
                    </button>
                  )}
                </div>
              </div>

              {/* Feedback Section */}
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
                {/* Share Button */}
                <button onClick={handleShare} className="text-slate-400 text-sm font-bold flex items-center gap-2 hover:text-slate-600">
                  <Share2 size={14} /> Share Brief
                </button>
              </div>

            </div>
          ) : (
            // Fallback / Error State
            <div className="bg-slate-50 p-8 rounded-[2.5rem] text-center space-y-4 border border-slate-200" data-testid="ai-error">
              {aiError ? (
                <>
                  <p className="text-red-500 font-bold">{aiError}</p>
                  <p className="text-slate-400 text-sm">Please check the console or ensure your API key is correctly configured and has available quota.</p>
                </>
              ) : (
                <p className="text-slate-400 font-medium">System is thinking...</p>
              )}
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
            </div>
          )}
        </div>
      )}

      {activeTab === 'prepare' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6" data-testid="tab-content-prepare">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${targetProfile === p
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

          {aiInsight && targetProfile ? (
            <div data-testid="prepare-ai-loaded">
              {/* Meeting Context */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-sm font-bold text-slate-600">
                    <span>{targetProfile === 'Guardian' ? '🛡️' : targetProfile === 'Driver' ? '🎯' : targetProfile === 'Integrator' ? '🤝' : '🚀'}</span>
                    <span>{targetProfile}</span>
                  </div>
                  <div className="text-slate-300">→</div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'he' ? 'אתה' : 'You'}</p>
                    <p className="text-sm font-black text-slate-900">{currentPersona.title[language]}</p>
                  </div>
                </div>
              </div>

              {/* The Challenge */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden">
                <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl border border-red-100 bg-white shadow-sm text-red-500">
                    <Zap size={18} />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {language === 'he' ? 'נקודת החיכוך' : 'Where You Might Clash'}
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-lg font-black text-slate-900 leading-relaxed mb-3">{aiInsight.interaction_guide.friction_point}</p>
                  <p className="text-sm text-slate-600">
                    {language === 'he'
                      ? 'זו הנקודה שלרוב מביאה לחיכוך בתקשורת בין פרופילים אלה. הכר אותה מראש.'
                      : 'This is the core tension that typically emerges. Expect it, and you\'ll navigate it better.'}
                  </p>
                </div>
              </div>

              {/* The Strategy */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
                  <Target size={18} className="text-green-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest">{language === 'he' ? 'אסטרטגיית הנהלה' : 'Your Game Plan'}</h3>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      {aiInsight.interaction_guide.strategy_card.action}
                    </h4>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
                    <span className="absolute -top-2 left-4 bg-slate-900 text-white text-[9px] font-bold px-3 py-1 rounded text-slate-100 uppercase">💬 Script</span>
                    <p className="text-lg text-slate-800 italic font-bold leading-relaxed mt-2">"{aiInsight.interaction_guide.strategy_card.script}"</p>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">{language === 'he' ? 'טיפ' : 'Tip'}</p>
                    <p className="text-sm text-blue-900">
                      {language === 'he'
                        ? 'השתמש בדברים אלה בהתחלת הפגישה כדי להגדיר טון משותף ולהימנע מחיכוך.'
                        : 'Use this opener early in the meeting to set a collaborative tone and avoid friction.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ADHD Hack for This Scenario */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
                    <Lightbulb size={18} />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {language === 'he' ? 'טריק לרגע הפגישה' : 'ADHD Hack for This Meeting'}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-black text-slate-800">{aiInsight.executive_function_tool.tool_name}</h3>
                  <p className="text-slate-600 font-medium text-sm">{aiInsight.executive_function_tool.instruction}</p>
                  {aiInsight.executive_function_tool.template_ready && (
                    <button className="w-full py-3 bg-[#f3ecff] text-[#8c50f0] font-black rounded-xl text-sm hover:bg-[#e4d7ff] transition-colors flex items-center justify-center gap-2">
                      <span>📝</span>
                      {language === 'he' ? 'הכן דף טיוטה לפגישה' : 'Create Meeting Notes Template'}
                    </button>
                  )}
                </div>
              </div>

              {/* Pre-Meeting Checklist */}
              <div className="bg-gradient-to-br from-[#f3ecff] to-slate-50 p-6 rounded-[2.5rem] shadow-xl border border-[#e4d7ff]">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={20} className="text-[#8c50f0]" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    {language === 'he' ? 'רשימה לפני הפגישה' : 'Before the Meeting'}
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <span className="text-[#8c50f0] font-black">✓</span>
                    <span>{language === 'he' ? 'כן לדברים שעלולים להעלות טר - הם צפויים' : 'Expect the friction point - it\'s normal'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#8c50f0] font-black">✓</span>
                    <span>{language === 'he' ? 'תרגל את התסריט - זה יעזור בדיבור ספונטני' : 'Practice your script - it\'ll feel natural'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#8c50f0] font-black">✓</span>
                    <span>{language === 'he' ? 'השתמש בטריק של ADHD כדי להישאר ממוקד' : 'Use the ADHD hack to stay grounded'}</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-12 rounded-[2.5rem] text-center space-y-4 border border-slate-200">
              <p className="text-slate-500 font-medium">{language === 'he' ? 'בחר פרופיל לפגישה מהכרטיס ״ניתוח AI״ כדי להתחיל.' : 'Select a profile to meet with in the AI Analysis tab to get started.'}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6" data-testid="tab-content-matrix">
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

      <ConsultationMobile persona={currentPersona} colors={colors} language={language} t={t} onTrack={trackClick} />

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
      <h4 className="flex items-center gap-2 font-black text-slate-800 text-lg tracking-tight">{icon} {title}</h4>
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

function ConsultationMobile({ persona, colors, language, t, onTrack }: { persona: Persona, colors: any, language: Language, t: any, onTrack: (type: string) => void }) {
  const cta = t.report.cta;
  return (
    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-8 shadow-2xl overflow-hidden relative border border-white/5">
      <div className="absolute top-0 left-0 right-0 h-[3px] brand-gradient" />
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/5 text-purple-300`}>
            <BrainCircuit size={12} /> ADHD Insight
          </span>
        </div>

        <div className="space-y-3">
          <h3 className={`text-2xl font-black leading-tight text-purple-300`}>{cta.title}</h3>

          <p className="text-slate-300 text-sm font-medium leading-relaxed">
            {persona.communication_challenge[language]}
          </p>

          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-2">
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${colors.accent}`}>{t.report.adhd_title}</h4>
            <p className="text-white font-bold text-sm leading-relaxed italic">
              {persona.adhd_challenge[language]}
            </p>
          </div>
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

      <div className="pt-6 border-t border-white/5 relative z-10 space-y-4 text-center">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{cta.follow}</p>
        <div className="flex justify-center gap-6">
          <SocialIcon href={SOCIAL_LINKS.linkedin} icon={<Linkedin size={22} />} label="LinkedIn" onTrack={() => onTrack('linkedin')} />
          <SocialIcon href={SOCIAL_LINKS.facebook} icon={<Facebook size={22} />} label="Facebook" onTrack={() => onTrack('facebook')} />
          <SocialIcon href={SOCIAL_LINKS.youtube} icon={<Youtube size={22} />} label="YouTube" onTrack={() => onTrack('youtube')} />
        </div>
      </div>

      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.from}/10 rounded-full blur-3xl -mr-10 -mt-10`} />
    </div>
  );
}

function SocialIcon({ href, icon, label, onTrack }: { href: string, icon: React.ReactNode, label: string, onTrack: () => void }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      onClick={onTrack}
      className="text-slate-400 hover:text-white transition-all active:scale-90"
      aria-label={label}
    >
      {icon}
    </a>
  );
}


function ContextIcon({ profile }: { profile: string | null }) {
  if (!profile) return <Users size={18} className="text-slate-400" />;
  if (profile === 'Guardian') return <span className="text-lg">🛡️</span>;
  if (profile === 'Driver') return <span className="text-lg">🎯</span>;
  if (profile === 'Integrator') return <span className="text-lg">🤝</span>;
  return <span className="text-lg">🚀</span>;
}

export default ReportView;