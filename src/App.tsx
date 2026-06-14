import React, { useState, useEffect } from 'react';
import {
  Globe, ArrowLeft, ArrowRight, User, Mail, Brain, Sparkles, Award,
  Play, Loader2, Zap, ChevronLeft, ChevronRight, AlertCircle, TrendingDown,
  Layers, Gift, Users, X, Copy, Check
} from 'lucide-react';
import {
  TEXT, PERSONA_DATA, traitsList, GOOGLE_SCRIPT_URL, APP_ID, getIconComponent
} from './constants';
import { Language, User as UserType, Results, Persona, Trait } from './types';
import { calculateResults, getPersona, generateMockAnswers } from './scoring';
import ReportView from './components/ReportView';
import SessionWizard from './components/SessionWizard';
import SessionLobby from './components/SessionLobby';
import ComparisonView from './components/ComparisonView';
import LiveProgressBar from './components/LiveProgressBar';
import Footer from './components/Footer';
import TermsPage from './components/legal/TermsPage';
import PrivacyPage from './components/legal/PrivacyPage';
import AccessibilityPage from './components/legal/AccessibilityPage';
import SignUpForm from './components/SignUpForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import { useSession } from './hooks/useSession';
import { analytics } from './firebaseConfig';
import { useAuth } from './hooks/useAuth';
import { logEvent } from 'firebase/analytics';


const Logo = ({ size = "sm", onClick }: { size?: "sm" | "lg", onClick?: () => void }) => {
  const height = size === "lg" ? "h-16" : "h-8";

  const handleLogoClick = (e: React.MouseEvent) => {
    logEvent(analytics, 'link_click', {
      link_type: 'logo',
      link_url: 'https://justaiit.web.app/#app=business-chemistry'
    });
    if (onClick) onClick();
    window.open('https://justaiit.web.app/#app=business-chemistry', '_blank');
  };

  return (
    <img
      src="/justaiit-logo.svg"
      alt="Just AI It"
      onClick={handleLogoClick}
      className={`${height} select-none hover:opacity-80 transition-opacity cursor-pointer`}
    />
  );
};


export default function App() {
  const [language, setLanguage] = useState<Language>('he');
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [step, setStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [user, setUser] = useState<UserType>({ name: '', email: '' });
  const [password, setPassword] = useState('');
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

  // Auth hook — owns all Firebase auth state and handlers
  const {
    authUser,
    authError,
    isAuthLoading,
    showSignUpForm,
    setShowSignUpForm,
    signUpError,
    isSigningUp,
    showForgotPasswordForm,
    setShowForgotPasswordForm,
    forgotPasswordError,
    setForgotPasswordError,
    isSendingReset,
    login,
    logout,
    register,
    signUp,
    forgotPassword,
  } = useAuth();

  // Sync authUser changes to local user state (name/email for questionnaire)
  useEffect(() => {
    if (authUser) {
      setUser({
        name: authUser.displayName || '',
        email: authUser.email || '',
      });
    }
  }, [authUser]);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleGoogleLogin = async () => {
    await login();
    if (authUser) {
      setStep(2);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser({ name: '', email: '' });
    setStep(1);
    setAnswers({});
  };

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(user.email, password);
    if (!authError) {
      setPassword('');
      setStep(2);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password);
    if (!signUpError) {
      setPassword('');
      setStep(2);
    }
  };

  const handleForgotPassword = async (email: string) => {
    await forgotPassword(email);
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
    setStep(authUser ? 2 : 1);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setLogoClicks(0);
  };

  const currentTrait = traitsList[currentQuestionIndex];
  const isDudiMode = user.email.trim().toLowerCase() === 'tsur.david@gmail.com';

  if (currentHash === '#terms') return <TermsPage language={language} />;
  if (currentHash === '#privacy') return <PrivacyPage language={language} />;
  if (currentHash === '#accessibility') return <AccessibilityPage language={language} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col no-select">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setLanguage(l => l === 'he' ? 'en' : 'he')}
          className="flex items-center gap-1.5 text-xs font-black px-3 py-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <Globe size={14} />
          {language === 'he' ? 'ENGLISH' : 'עברית'}
        </button>

        {authUser && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors ml-2"
          >
            <X size={14} />
            {t.form.logout_btn}
          </button>
        )}

        {isSessionMode && sessionId ? (
          <div className="flex items-center gap-2">
            <div
              onClick={copySessionCode}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f3ecff] border border-[#e4d7ff] rounded-full cursor-pointer hover:bg-[#e4d7ff] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#8c50f0] animate-pulse" />
              <span className="text-xs font-black text-[#6a2dd0] tracking-widest font-mono">{sessionId}</span>
              {copiedCode ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-[#8c50f0]" />}
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
            className={`flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-full transition-colors ml-2 ${isSessionMode ? 'bg-[#8c50f0] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
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
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-[20%] bg-gradient-to-br from-[#a014f0] via-[#5078ff] to-[#3cdcf0] shadow-[0_6px_16px_rgba(140,80,240,0.20)] flex items-center justify-center">
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 6 13 a5 5 0 0 1 5 -5 h12 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-9 l-4 4 v-4 a5 5 0 0 1 -4 -5 z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
                      <path d="M 16 21 a5 5 0 0 1 5 -5 h12 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-9 l-4 4 v-4 a5 5 0 0 1 -4 -5 z" fill="rgba(255,255,255,0.28)" stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-[#8c50f0]">
                  Workplace Communication OS
                </p>
                <h1 className="text-5xl font-black leading-[0.9] gradient-text tracking-tight">{t.welcome_title}</h1>
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

                <form onSubmit={handleRegister} className="bg-white px-10 py-12 rounded-[2rem] shadow-xl border border-slate-100 space-y-6 relative overflow-hidden max-w-sm mx-auto">
                  <div className="space-y-6 relative z-10 w-full mb-2">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full py-3 bg-white border border-slate-200 text-[#1e293b] rounded-xl font-bold font-sans text-[15px] flex items-center justify-center gap-3 transition-colors hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-[18px] h-[18px]" />
                      Sign in with Google
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center py-2 z-10">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-white px-4 text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">OR</span>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <input
                      type="email" required value={user.email} onChange={e => setUser({ ...user, email: e.target.value })}
                      placeholder="Email address"
                      className="w-full px-5 py-3.5 bg-white rounded-xl border border-slate-200 focus:border-[#8c50f0] focus:ring-1 focus:ring-purple-300 transition-all outline-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400"
                    />
                    <input
                      type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-5 py-3.5 bg-white rounded-xl border border-slate-200 focus:border-[#8c50f0] focus:ring-1 focus:ring-purple-300 transition-all outline-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400"
                    />
                    {authError && (
                      <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-red-700">{authError}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end relative z-10 w-full -mt-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordForm(true)}
                      className="text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="relative z-10 w-full py-3.5 btn-gradient text-white rounded-xl font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAuthLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>

                  <div className="text-center pt-2 relative z-10 w-full">
                    <span className="text-slate-400 font-medium text-[13px]">Don't have an account? </span>
                    <button type="button" onClick={() => setShowSignUpForm(true)} className="text-[#8b5cf6] font-bold text-[13px] hover:text-purple-600 transition-colors">Sign up</button>
                  </div>
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
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-[0_8px_24px_rgba(15,23,42,0.08)] p-5 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm text-[#8c50f0]">
                      <Zap size={18} fill="currentColor" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-sm font-black text-slate-800 tracking-tight">
                        {language === 'he' ? 'באיזה צד אתם?' : 'Which side are you on?'}
                      </h2>
                      <p className="eyebrow mt-0.5">
                        {language === 'he'
                          ? 'מקמו את עצמכם על הסקאלה בין שתי התכונות.'
                          : 'Place yourself on the scale between the two traits.'}
                      </p>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#f3ecff] rounded-full blur-2xl"></div>
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

                {isDudiMode && !sessionId && (
                  <div className="flex justify-center mb-3">
                    <button
                      onClick={() => {
                        const mockAnswers = generateMockAnswers('PIONEER');
                        setAnswers(mockAnswers);
                        setStep(3);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-[#f3ecff] text-[#8c50f0] border border-[#e4d7ff] hover:bg-[#e4d7ff] transition-colors"
                    >
                      🎲 {language === 'he' ? 'נתוני דמו' : 'Demo data'}
                    </button>
                  </div>
                )}

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
                        className={`px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl ${isQuestionnaireComplete ? 'btn-gradient text-white' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : t.quiz.finish_btn}
                      </button>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#a014f0] via-[#5078ff] to-[#3cdcf0] transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}

                {sessionId && (
                  <div className="flex justify-center pb-4">
                    <button
                      onClick={finishAndSave}
                      disabled={!isQuestionnaireComplete || isSubmitting}
                      className={`w-full max-w-xs py-4 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-xl ${isQuestionnaireComplete ? 'btn-gradient text-white' : 'bg-slate-100 text-slate-400'}`}
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
                  submitError={submitError}
                  language={language}
                  t={t}
                  forceDebug={logoClicks >= 5}
                />
              )}
            </div>
          )
        }


        {showSignUpForm && (
          <SignUpForm
            onSubmit={handleSignUp}
            onClose={() => setShowSignUpForm(false)}
            isLoading={isSigningUp}
            error={signUpError}
          />
        )}

        {showForgotPasswordForm && (
          <ForgotPasswordForm
            onSubmit={handleForgotPassword}
            onClose={() => {
              setShowForgotPasswordForm(false);
              setForgotPasswordError(null);
            }}
            isLoading={isSendingReset}
            error={forgotPasswordError}
          />
        )}

        <Footer language={language} />
      </main>
    </div>
  );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className={`flex gap-5 p-5 rounded-[2rem] border-2 border-white shadow-lg shadow-slate-200/40 items-center bg-white/80 backdrop-blur-sm transition-all hover:scale-[1.02]`}>
      <div className="p-4 bg-white rounded-2xl shrink-0 shadow-sm border border-slate-100 text-[#8c50f0]">{icon}</div>
      <div className="space-y-1">
        <h4 className="font-black text-slate-800 text-base leading-tight">{title}</h4>
        <p className="text-sm text-slate-500 font-bold leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function MobileQuestionCard({ trait, index, value, onChange, language }: { trait: Trait, index: number, value: number | undefined, onChange: (i: number, v: number) => void, language: Language }) {
  if (!trait || !trait.left || !trait.right) return null;

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
            <h3 className={`text-2xl font-black leading-tight text-[#8c50f0]`}>
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
              className={`h-full transition-all duration-700 ease-out bg-gradient-to-r from-[#a014f0] via-slate-100 to-[#3cdcf0] opacity-10`}
            />
          </div>

          <div className="grid grid-cols-6 gap-2 relative z-10">
            {[1, 2, 3, 4, 5, 6].map(v => (
              <div key={v} className="flex flex-col items-center gap-3">
                <button
                  onClick={() => onChange(index, v)}
                  className={`w-full aspect-square rounded-2xl text-xl font-black transition-all duration-300 flex items-center justify-center ${value === v
                    ? `btn-score-active text-white shadow-xl scale-125 ring-4 ring-[#8c50f0]/30 ring-offset-2 ring-offset-white`
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
              <span className={`text-[10px] font-black uppercase tracking-tight block transition-colors leading-tight ${value === 1 ? 'text-[#8c50f0]' : 'text-slate-400'}`}>
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