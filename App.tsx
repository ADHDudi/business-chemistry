import React, { useState, useEffect } from 'react';
import {
  Globe, ArrowLeft, ArrowRight, User, Mail, Brain, Sparkles, Award,
  Play, Loader2, Zap, ChevronLeft, ChevronRight, AlertCircle, TrendingDown,
  Layers, Gift, Users, X, Copy, Check
} from 'lucide-react';
import {
  TEXT, PERSONA_DATA, traitsList, GOOGLE_SCRIPT_URL, APP_ID, getIconComponent
} from './constants';
import { Language, User as UserType, Results, Persona, AxisType, Trait } from './types';
import ReportView from './components/ReportView';
import SessionWizard from './components/SessionWizard';
import SessionLobby from './components/SessionLobby';
import ComparisonView from './components/ComparisonView';
import LiveProgressBar from './components/LiveProgressBar';
import { useSession } from './hooks/useSession';


const Logo = ({ size = "sm", onClick }: { size?: "sm" | "lg", onClick?: () => void }) => {
  const isLg = size === "lg";
  const boxW = isLg ? "w-14" : "w-8";
  const boxH = isLg ? "h-16" : "h-9";
  const iconSize = isLg ? 28 : 16;
  const textSize = isLg ? "text-6xl" : "text-3xl";

  const handleLogoClick = (e: React.MouseEvent) => {
    // Execute original callback if present (e.g. for debug mode)
    if (onClick) onClick();
    // Open external link
    window.open('https://linktr.ee/ADHDudi', '_blank');
  };

  return (
    <div
      onClick={handleLogoClick}
      className="flex items-end gap-1 select-none hover:opacity-80 transition-opacity cursor-pointer"
      dir="ltr"
    >
      <div className="flex gap-1 items-end">
        <div className={`${boxW} ${boxH} bg-[#E46B3F] rounded-t-full rounded-b-lg flex flex-col items-center justify-center relative shadow-sm`}>
          <Zap size={iconSize} className="text-white fill-white -mt-1" />
          <div className="absolute bottom-1 left-1.5 flex flex-col gap-0.5">
            <div className={`${isLg ? 'w-4 h-1.5' : 'w-2.5 h-1'} bg-[#90BC6E] rounded-sm`} />
            <div className={`${isLg ? 'w-4 h-1.5' : 'w-2.5 h-1'} bg-[#90BC6E] rounded-sm`} />
          </div>
        </div>
        <div className={`${boxW} ${boxH} bg-[#D9618E] rounded-tr-[50%] rounded-br-lg rounded-tl-lg rounded-bl-lg flex items-center justify-center shadow-sm`}>
          <Zap size={iconSize} className="text-white fill-white" />
        </div>
        <div className={`${boxW} ${boxH} bg-[#78A9D6] rounded-lg flex items-center justify-center shadow-sm`}>
          <Zap size={iconSize} className="text-white fill-white" />
        </div>
        <div className={`${boxW} ${boxH} bg-[#324FA2] rounded-tr-[50%] rounded-br-lg rounded-tl-lg rounded-bl-lg flex items-center justify-center shadow-sm`}>
          <Zap size={iconSize} className="text-white fill-white" />
        </div>
      </div>
      <span className={`${textSize} font-black text-[#324FA2] leading-none tracking-tighter mb-0.5`}>udi</span>
    </div>
  );
};

const calculateResults = (answers: Record<number, number>): Results => {
  const profileData = traitsList.map((trait, index) => {
    const rawScore = answers[index] || 3.5;
    let normalizedScore = rawScore;
    if (trait.reverse) {
      normalizedScore = 7 - rawScore;
    }
    return { ...trait, rawScore, normalizedScore };
  });

  const formalTraits = profileData.filter(t => t.axis === AxisType.FORMAL);
  const dominantTraits = profileData.filter(t => t.axis === AxisType.DOMINANT);

  const avgFormal = formalTraits.reduce((acc, curr) => acc + curr.normalizedScore, 0) / (formalTraits.length || 1);
  const avgDominant = dominantTraits.reduce((acc, curr) => acc + curr.normalizedScore, 0) / (dominantTraits.length || 1);

  return {
    formal: avgFormal.toFixed(2),
    dominant: avgDominant.toFixed(2),
    profileData
  };
};

const getPersona = (formal: string, dominant: string): Persona => {
  const f = parseFloat(formal);
  const d = parseFloat(dominant);

  if (d > 3.5) {
    if (f > 3.5) return PERSONA_DATA.DRIVER;
    return PERSONA_DATA.PIONEER;
  } else {
    if (f > 3.5) return PERSONA_DATA.GUARDIAN;
    return PERSONA_DATA.INTEGRATOR;
  }
};

const generateMockAnswers = (targetPersonaKey: string) => {
  const answers: Record<number, number> = {};
  traitsList.forEach((trait, index) => {
    let targetNormalized = 3.5;
    if (trait.axis === AxisType.DOMINANT) {
      targetNormalized = (targetPersonaKey === 'PIONEER' || targetPersonaKey === 'DRIVER') ? 5 + Math.random() : 1 + Math.random();
    } else if (trait.axis === AxisType.FORMAL) {
      targetNormalized = (targetPersonaKey === 'DRIVER' || targetPersonaKey === 'GUARDIAN') ? 5 + Math.random() : 1 + Math.random();
    }
    let rawScore = Math.round(trait.reverse ? 7 - targetNormalized : targetNormalized);
    answers[index] = Math.max(1, Math.min(6, rawScore));
  });
  return answers;
};

export default function App() {
  const [language, setLanguage] = useState<Language>('he');
  const [step, setStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [user, setUser] = useState<UserType>({ name: '', email: '' });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoClicks, setLogoClicks] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Session Hook
  const {
    sessionId, myRole, sessionData,
    startSession, joinExistingSession, submitAnswers
  } = useSession();
  const [isSessionMode, setIsSessionMode] = useState(false);

  useEffect(() => {
    if (sessionId && myRole && sessionData) {
      // Sync external partner's name if joined
      if (myRole === 'A' && sessionData.founderBName) {
        // Notification or just UI update handles it
      }
    }
  }, [sessionData, myRole, sessionId]);

  // Sync answers to Firestore if in session
  useEffect(() => {
    if (sessionId && myRole) {
      submitAnswers(answers);
    }
  }, [answers, sessionId, myRole, submitAnswers]);



  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = TEXT[language];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.name && user.email) setStep(2);
  };

  const handleDemoClick = (personaKey: string) => {
    const isActuallyDudi = user.name.trim().toLowerCase() === 'dudi';
    setUser({
      name: isActuallyDudi ? 'Dudi' : 'Dudi Demo',
      email: user.email || 'demo@example.com'
    });
    setAnswers(generateMockAnswers(personaKey));
    setStep(3);
  };

  const handleAnswer = (index: number, value: number) => {
    setAnswers(prev => ({ ...prev, [index]: value }));
    if (index < traitsList.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(index + 1);
      }, 300);
    }
  };

  const onLogoClick = () => {
    if (step === 3) {
      setLogoClicks(prev => prev + 1);
    }
  };

  const copySessionCode = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const completedCount = Object.keys(answers).length;
  const isQuestionnaireComplete = traitsList.every((_, idx) => answers[idx] !== undefined);
  const progressPercent = (completedCount / traitsList.length) * 100;

  // Calculate partner progress
  const partnerRole = myRole === 'A' ? 'answersB' : 'answersA';
  const partnerAnswers = sessionData ? (sessionData as any)[partnerRole] || {} : {};
  const partnerProgress = Object.keys(partnerAnswers).length;
  const partnerName = sessionData ? (myRole === 'A' ? sessionData.founderBName : sessionData.founderAName) : '';

  const finishAndSave = async () => {
    setIsSubmitting(true);
    const results = calculateResults(answers);
    const persona = getPersona(results.formal, results.dominant);

    // Save to Google Sheets
    const payload = {
      appId: APP_ID,
      user,
      scores: { formal: results.formal, dominant: results.dominant },
      personaKey: persona.key,
      personaTitle: persona.title[language],
      personaDetails: {
        strengths: persona.strengths[language].join('; '),
        tips: persona.tips[language].join('; '),
        adhd_challenge: persona.adhd_challenge[language],
        communication_challenge: persona.communication_challenge[language],
        consultation_benefit: persona.consultation_benefit[language]
      },
      aiInsight: "",
      aiFeedback: "Pending",
      refinementReason: "",
      answers,
      language,
      isFinal: false,
      timestamp: new Date().toISOString(),
      clicks: { website: false, schedule: false, socials: {} },

    };

    try {
      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
      }

      // Flow Logic
      setStep(3); // Go to Report View

    } catch (error) {
      console.error("Save error:", error);
      setSubmitError(language === 'he' ? "חלה שגיאה בשמירה, אך ניתן לראות את התוצאות." : "Save error, but you can still view results.");
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleReset = () => {
    setStep(1);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setLogoClicks(0);
    setLogoClicks(0);
  };

  const currentTrait = traitsList[currentQuestionIndex];
  const isDudiMode = user.name.trim().toLowerCase().includes('dudi');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col no-select">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <Logo size="sm" onClick={onLogoClick} />

        <button
          onClick={() => setLanguage(l => l === 'he' ? 'en' : 'he')}
          className="flex items-center gap-1.5 text-xs font-black px-3 py-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <Globe size={14} />
          {language === 'he' ? 'ENGLISH' : 'עברית'}
        </button>

        {isSessionMode && sessionId ? (
          <div className="flex items-center gap-2">
            <div
              onClick={copySessionCode}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#D9618E]/10 border border-[#D9618E]/20 rounded-full cursor-pointer hover:bg-[#D9618E]/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#D9618E] animate-pulse" />
              <span className="text-xs font-black text-[#D9618E] tracking-widest font-mono">{sessionId}</span>
              {copiedCode ? <Check size={12} className="text-[#D9618E]" /> : <Copy size={12} className="text-[#D9618E]" />}
            </div>
            <button
              onClick={() => {
                // Reset session state needs to be handled, for now just toggle mode UI
                if (window.confirm(language === 'he' ? 'האם לצאת מהסשן?' : 'Exit live session?')) {
                  setIsSessionMode(false);
                  // Ideally call exitSession() from hook
                }
              }}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSessionMode(!isSessionMode)}
            className={`flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-full transition-colors ml-2 ${isSessionMode ? 'bg-[#324FA2] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Users size={14} />
            {isSessionMode ? (language === 'he' ? 'חזרה לרגיל' : 'Exit Live') : (language === 'he' ? 'מצב Live' : 'Live Mode')}
          </button>
        )}
      </header>


      <main className="flex-1 overflow-x-hidden flex flex-col">
        {step === 1 && (
          <div className="p-5 max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="text-center space-y-4 mt-8 mb-6">
              <>
                <h1 className="text-5xl font-black leading-[0.9] text-[#324FA2] tracking-tight">{t.welcome_title}</h1>
                <p className="text-xl text-slate-600 font-bold leading-relaxed">{t.welcome_subtitle}</p>
              </>
            </div>

            {isSessionMode ? (
              <div className="space-y-6">
                <SessionWizard
                  onStartSession={async (name, email) => {
                    await startSession(name, email);
                    setUser({ name, email });
                    setStep(2);
                  }}
                  onJoinSession={async (id, name, email) => {
                    await joinExistingSession(id, name, email);
                    setUser({ name, email });
                    setStep(2);
                  }}
                  isProcessing={isSubmitting} // Reuse for now or add new state
                  language={language}
                />
              </div>
            ) : (
              <>

                <div className="space-y-4">
                  {/* ORDER: Pain, Cost, Method, WIIFM */}
                  <BenefitCard
                    icon={getIconComponent(t.sections.pain.icon, 24, "text-red-500")}
                    title={t.sections.pain.title}
                    desc={t.sections.pain.desc}
                  />
                  <BenefitCard
                    icon={getIconComponent(t.sections.cost.icon, 24, "text-orange-500")}
                    title={t.sections.cost.title}
                    desc={t.sections.cost.desc}
                  />
                  <BenefitCard
                    icon={getIconComponent(t.sections.method.icon, 24, "text-blue-500")}
                    title={t.sections.method.title}
                    desc={t.sections.method.desc}
                  />
                  <BenefitCard
                    icon={getIconComponent(t.sections.wiifm.icon, 24, "text-green-500")}
                    title={t.sections.wiifm.title}
                    desc={t.sections.wiifm.desc}
                  />
                </div>

                <form onSubmit={handleRegister} className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border-2 border-white space-y-6 relative overflow-hidden">
                  {/* Decorative background blur similar to ReportView */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

                  <div className="space-y-2 relative z-10">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t.form.name_label}</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#324FA2] transition-colors" size={20} />
                      <input
                        type="text" required value={user.name} onChange={e => setUser({ ...user, name: e.target.value })}
                        placeholder={t.form.name_placeholder}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-[#324FA2] focus:bg-white transition-all outline-none font-bold text-lg text-slate-800 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t.form.email_label}</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#D9618E] transition-colors" size={20} />
                      <input
                        type="email" required value={user.email} onChange={e => setUser({ ...user, email: e.target.value })}
                        placeholder={t.form.email_placeholder}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-[#D9618E] focus:bg-white transition-all outline-none font-bold text-lg text-slate-800 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <button type="submit" className="relative z-10 w-full py-5 bg-gradient-to-r from-[#324FA2] to-[#4a6dc9] text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 active:scale-95 transition-all hover:shadow-2xl hover:brightness-110">
                    {t.form.submit_btn}
                    {language === 'he' ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
                  </button>
                </form>

                {isDudiMode && (
                  <div className="text-center space-y-3 pb-10 animate-in fade-in zoom-in-95 duration-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.demo.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['PIONEER', 'GUARDIAN', 'DRIVER', 'INTEGRATOR'].map(k => (
                        <button key={k} onClick={() => handleDemoClick(k)} className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 active:bg-slate-100 transition-colors">
                          {(t.demo as any)[k.toLowerCase()]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}
          </div>
        )
        }


        {
          step === 2 && (
            <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="mb-6">
                <div className="bg-[#324FA2] text-white p-5 rounded-[2rem] shadow-lg shadow-blue-200 relative overflow-hidden">
                  <div className="relative z-10 space-y-1">
                    <h2 className="text-lg font-black flex items-center gap-2 tracking-tight">
                      <Zap size={18} fill="currentColor" />
                      {language === 'he' ? 'באיזה צד אתם?' : 'Which side are you on?'}
                    </h2>
                    <p className="text-blue-100 text-xs font-medium leading-snug">
                      {language === 'he'
                        ? 'מקמו את עצמכם על הסקאלה בין שתי התכונות.'
                        : 'Place yourself on the scale between the two traits.'}
                    </p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                </div>
              </div>

              {isSessionMode && sessionId && sessionData && myRole && (
                <>
                  <SessionLobby
                    sessionData={sessionData}
                    myRole={myRole}
                    language={language}
                  />
                  <LiveProgressBar
                    myProgress={completedCount}
                    partnerProgress={partnerProgress}
                    totalQuestions={traitsList.length}
                    partnerName={partnerName}
                    language={language}
                  />
                </>
              )}

              <div className="flex-1 flex items-center justify-center">
                {currentTrait ? (
                  <div key={currentQuestionIndex} className="w-full animate-in slide-in-from-right-10 fade-in duration-300">
                    <MobileQuestionCard
                      trait={currentTrait}
                      index={currentQuestionIndex}
                      value={answers[currentQuestionIndex]}
                      onChange={handleAnswer}
                      language={language}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 text-slate-400">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="font-bold">{language === 'he' ? 'טוען שאלה...' : 'Loading question...'}</p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6">
                <div className="flex items-center justify-between gap-4 mb-4 px-2">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className={`p-4 rounded-2xl font-black transition-all ${currentQuestionIndex === 0 ? 'text-slate-200 bg-slate-50' : 'text-slate-600 bg-white border border-slate-200 shadow-sm active:bg-slate-50'}`}
                  >
                    <ChevronRight size={24} className={language === 'en' ? 'rotate-180' : ''} />
                  </button>

                  <div className="text-center">
                    <span className="text-3xl font-black text-slate-900 leading-none">{currentQuestionIndex + 1}</span>
                    <span className="text-slate-400 font-bold text-sm"> / {traitsList.length}</span>
                  </div>

                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(traitsList.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === traitsList.length - 1 || answers[currentQuestionIndex] === undefined}
                    className={`p-4 rounded-2xl font-black transition-all ${currentQuestionIndex === traitsList.length - 1 || answers[currentQuestionIndex] === undefined ? 'text-slate-200 bg-slate-50' : 'text-slate-600 bg-white border border-slate-200 shadow-sm active:bg-slate-50'}`}
                  >
                    <ChevronLeft size={24} className={language === 'en' ? 'rotate-180' : ''} />
                  </button>
                </div>

                {!sessionId && (
                  <div className="bg-white border border-slate-200 p-4 rounded-[2.5rem] shadow-xl space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">{t.quiz.progress}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-slate-900 leading-none">{completedCount}</span>
                          <span className="text-slate-400 font-bold text-xs">/ {traitsList.length}</span>
                        </div>
                      </div>
                      <button
                        onClick={finishAndSave}
                        disabled={!isQuestionnaireComplete || isSubmitting}
                        className={`px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl ${isQuestionnaireComplete ? 'bg-[#E46B3F] text-white shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : t.quiz.finish_btn}
                      </button>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#78A9D6] via-[#D9618E] to-[#E46B3F] transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}

                {sessionId && (
                  <div className="flex justify-center pb-4">
                    <button
                      onClick={finishAndSave}
                      disabled={!isQuestionnaireComplete || isSubmitting}
                      className={`w-full max-w-xs py-4 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-xl ${isQuestionnaireComplete ? 'bg-[#E46B3F] text-white shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : t.quiz.finish_btn}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        }

        {
          step === 3 && (
            <div className="max-w-xl mx-auto p-4">
              {isSessionMode && sessionId && sessionData ? (
                <ComparisonView sessionData={sessionData} language={language} />
              ) : (
                <ReportView
                  user={user}
                  answers={answers}
                  onReset={handleReset}
                  submitError={submitError} language={language} t={t}
                  calculateResults={calculateResults} getPersona={getPersona}
                  forceDebug={logoClicks >= 5}
                />
              )}
            </div>
          )
        }


      </main>
    </div>
  );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className={`flex gap-5 p-5 rounded-[2rem] border-2 border-white shadow-lg shadow-slate-200/40 items-center bg-white/80 backdrop-blur-sm transition-all hover:scale-[1.02]`}>
      <div className="p-4 bg-white rounded-2xl shrink-0 shadow-sm border border-slate-100 text-[#324FA2]">{icon}</div>
      <div className="space-y-1">
        <h4 className="font-black text-slate-800 text-base leading-tight">{title}</h4>
        <p className="text-sm text-slate-500 font-bold leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function MobileQuestionCard({ trait, index, value, onChange, language }: { trait: Trait, index: number, value: number | undefined, onChange: (i: number, v: number) => void, language: Language }) {
  if (!trait || !trait.left || !trait.right) return null;

  const colors = [
    '',
    'bg-[#324FA2] shadow-blue-200 ring-[#324FA2]',    // 1
    'bg-[#324FA2]/80 shadow-blue-100 ring-[#324FA2]/50', // 2
    'bg-[#78A9D6] shadow-sky-100 ring-[#78A9D6]/50',    // 3
    'bg-[#D9618E]/80 shadow-pink-100 ring-[#D9618E]/50', // 4
    'bg-[#E46B3F]/80 shadow-orange-100 ring-[#E46B3F]/50',// 5
    'bg-[#E46B3F] shadow-orange-200 ring-[#E46B3F]'    // 6
  ];

  const translations = {
    he: { mostly: 'בעיקר' },
    en: { mostly: 'Mostly' }
  }[language];

  const getMostlyLabel = (side: 'left' | 'right') => {
    if (!trait || !trait.left || !trait.right) return "";

    const sideTrait = side === 'left' ? trait.left : trait.right;
    const traitText = sideTrait ? sideTrait[language] : "";

    if (language === 'he') {
      return side === 'left'
        ? `→ ${translations.mostly} ${traitText}`
        : `${translations.mostly} ${traitText} ←`;
    }
    return side === 'left'
      ? `← ${translations.mostly} ${traitText}`
      : `${translations.mostly} ${traitText} →`;
  };

  return (
    <div className={`p-8 rounded-[3.5rem] bg-white border-2 transition-all duration-500 ${value ? 'border-sky-50 shadow-2xl' : 'border-transparent shadow-xl'}`}>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 px-1">
          <div className={`flex-1 text-center transition-all duration-500 ${value && value <= 3 ? 'scale-110' : ''}`}>
            <h3 className={`text-2xl font-black leading-tight text-[#324FA2]`}>
              {trait.left[language]}
            </h3>
          </div>

          <div className="px-1 shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300 border border-slate-100 shadow-inner">VS</div>
          </div>

          <div className={`flex-1 text-center transition-all duration-500 ${value && value >= 4 ? 'scale-110' : ''}`}>
            <h3 className={`text-2xl font-black leading-tight text-[#E46B3F]`}>
              {trait.right[language]}
            </h3>
          </div>
        </div>

        <div className="relative py-10 px-2">
          <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-700 ease-out bg-gradient-to-r from-[#324FA2] via-slate-100 to-[#E46B3F] opacity-10`}
            />
          </div>

          <div className="grid grid-cols-6 gap-2 relative z-10">
            {[1, 2, 3, 4, 5, 6].map(v => (
              <div key={v} className="flex flex-col items-center gap-3">
                <button
                  onClick={() => onChange(index, v)}
                  className={`w-full aspect-square rounded-2xl text-xl font-black transition-all duration-300 flex items-center justify-center ${value === v
                    ? `${colors[v]} text-white shadow-xl scale-125 ring-4 ring-offset-2 ring-offset-white`
                    : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-slate-200 active:scale-95'
                    }`}
                >
                  {v}
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6 px-1">
            <div className="text-center w-[45%]">
              <span className={`text-[10px] font-black uppercase tracking-tight block transition-colors leading-tight ${value === 1 ? 'text-[#324FA2]' : 'text-slate-400'}`}>
                {getMostlyLabel('left')}
              </span>
            </div>
            <div className="text-center w-[10%] opacity-20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            </div>
            <div className="text-center w-[45%]">
              <span className={`text-[10px] font-black uppercase tracking-tight block transition-colors leading-tight ${value === 6 ? 'text-[#E46B3F]' : 'text-slate-400'}`}>
                {getMostlyLabel('right')}
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-bold text-slate-400 italic">
          {language === 'he' ? 'בחר/י את המספר שמשקף הכי טוב את הנטייה הטבעית שלך' : 'Choose the number that best reflects your natural tendency'}
        </p>
      </div>
    </div>
  );
}