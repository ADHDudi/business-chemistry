import React from 'react';
import {
  Zap, CheckCircle, Target, Hash, Sparkles,
  Brain, Loader2, BrainCircuit,
  Star, RefreshCw, Share2
} from 'lucide-react';
import { Persona, AICommunicationCoach, Language } from '../../types';
import { ContextIcon } from './shared';
import { CollapsibleSection } from '../CollapsibleSection';

/** 'unavailable' = the report wasn't saved, so there is nothing to attach feedback to. */
export type FeedbackStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unavailable';

const RATING_LABELS = {
  en: ['Not helpful', 'Slightly helpful', 'Somewhat helpful', 'Helpful', 'Very helpful'],
  he: ['לא מועיל', 'מעט מועיל', 'די מועיל', 'מועיל', 'מועיל מאוד'],
};

export interface ThemTabProps {
  currentPersona: Persona;
  aiInsight: AICommunicationCoach | null;
  isLoadingAI: boolean;
  aiError: string | null;
  feedbackRating: number;
  feedbackComment: string;
  feedbackStatus: FeedbackStatus;
  targetProfile: string | null;
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
  onTargetProfileChange: (profile: string) => void;
  onRatingChange: (rating: number) => void;
  onCommentChange: (text: string) => void;
  onFeedbackSubmit: () => void;
  onRefinementSubmit: () => void;
  onShare: () => void;
  onRetry: () => void;
}

const ThemTab: React.FC<ThemTabProps> = ({
  currentPersona,
  aiInsight,
  isLoadingAI,
  aiError,
  feedbackRating,
  feedbackComment,
  feedbackStatus,
  targetProfile,
  language,
  t,
  colors,
  adhdLens,
  onTargetProfileChange,
  onRatingChange,
  onCommentChange,
  onFeedbackSubmit,
  onRefinementSubmit,
  onShare,
  onRetry,
}) => {
  return (
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
              onClick={() => onTargetProfileChange(p)}
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

          {/* Feedback: 1–5 stars + free comment, saved on the report doc */}
          <div className="px-6 pb-6 pt-2 flex flex-col items-center gap-4" data-testid="ai-feedback">
            {feedbackStatus === 'saved' ? (
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-6 py-2 rounded-full border border-green-100" data-testid="feedback-saved">
                  <CheckCircle size={16} />
                  <span className="text-[11px] font-black uppercase tracking-tight">
                    {language === 'he' ? 'תודה על המשוב!' : 'Thanks for your feedback!'}
                  </span>
                </div>
                {feedbackRating <= 3 && feedbackComment.trim() && (
                  <button
                    onClick={onRefinementSubmit}
                    disabled={isLoadingAI}
                    className="w-full py-2 bg-[#8c50f0] text-white font-black rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> {language === 'he' ? 'שפר ניתוח לפי ההערה שלי' : 'Refine analysis using my comment'}
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full space-y-3">
                <p className="text-center text-xs font-black text-slate-500">
                  {language === 'he' ? 'כמה התובנה הזו מדויקת עבורך?' : 'How accurate is this insight for you?'}
                </p>
                <div className="flex justify-center gap-1" dir="ltr" role="radiogroup" aria-label={language === 'he' ? 'דירוג' : 'Rating'}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={feedbackRating === n}
                      aria-label={`${n} – ${RATING_LABELS[language][n - 1]}`}
                      title={RATING_LABELS[language][n - 1]}
                      onClick={() => onRatingChange(n)}
                      data-testid={`rating-star-${n}`}
                      className="p-1.5 rounded-full hover:scale-110 transition-transform"
                    >
                      <Star
                        size={28}
                        className={n <= feedbackRating ? 'text-amber-400' : 'text-slate-300'}
                        fill={n <= feedbackRating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                {feedbackRating > 0 && (
                  <p className="text-center text-[11px] font-bold text-slate-400">{RATING_LABELS[language][feedbackRating - 1]}</p>
                )}
                <textarea
                  value={feedbackComment}
                  onChange={e => onCommentChange(e.target.value)}
                  maxLength={2000}
                  placeholder={language === 'he' ? 'הערות חופשיות (לא חובה)' : 'Any comments? (optional)'}
                  data-testid="feedback-comment"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#8c50f0]/30"
                  rows={3}
                />
                <button
                  onClick={onFeedbackSubmit}
                  disabled={feedbackRating < 1 || feedbackStatus === 'saving' || feedbackStatus === 'unavailable'}
                  data-testid="feedback-submit"
                  className="w-full py-2 bg-[#8c50f0] text-white font-black rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {feedbackStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
                  {language === 'he' ? 'שלח משוב' : 'Send feedback'}
                </button>
                {feedbackStatus === 'error' && (
                  <p className="text-center text-xs font-bold text-red-500" data-testid="feedback-error">
                    {language === 'he' ? 'שמירת המשוב נכשלה. נסה/י שוב.' : "Couldn't save your feedback. Please try again."}
                  </p>
                )}
                {feedbackStatus === 'unavailable' && (
                  <p className="text-center text-xs font-bold text-slate-400">
                    {language === 'he' ? 'המשוב זמין רק לניתוח שנשמר.' : 'Feedback is available once your analysis is saved.'}
                  </p>
                )}
              </div>
            )}
            <button onClick={onShare} className="text-slate-400 text-sm font-bold flex items-center gap-2 hover:text-slate-600">
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
              onClick={onRetry}
              className="px-6 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              Retry Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ThemTab;
