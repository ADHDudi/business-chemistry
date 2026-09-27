/// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

vi.mock('../../firebaseConfig', () => ({ db: {}, analytics: {} }));
vi.mock('firebase/analytics', () => ({ logEvent: vi.fn() }));

import ThemTab, { ThemTabProps } from './ThemTab';
import { PERSONA_DATA } from '../../constants';
import type { AICommunicationCoach } from '../../types';

afterEach(cleanup);

const insight: AICommunicationCoach = {
  user_profile: { type: 'Pioneer', superpower: 'Vision', kryptonite: 'Details' },
  interaction_guide: {
    target_profile: 'GUARDIAN',
    friction_point: 'Pace',
    strategy_card: { title: 'Slow down', action: 'Pause', script: 'Let me recap' },
  },
  executive_function_tool: { tool_name: 'Parking Lot', instruction: 'Write it down', template_ready: false },
};

const colors = { bg: '', text: '', accent: '', from: '', to: '', shadow: '', border: '', glow: '' };

function renderTab(overrides: Partial<ThemTabProps> = {}) {
  const props: ThemTabProps = {
    currentPersona: Object.values(PERSONA_DATA)[0],
    aiInsight: insight,
    isLoadingAI: false,
    aiError: null,
    feedbackRating: 0,
    feedbackComment: '',
    feedbackStatus: 'idle',
    targetProfile: 'Guardian',
    language: 'en',
    t: { report: { them: {}, cta: {} } },
    colors,
    adhdLens: false,
    onTargetProfileChange: vi.fn(),
    onRatingChange: vi.fn(),
    onCommentChange: vi.fn(),
    onFeedbackSubmit: vi.fn(),
    onRefinementSubmit: vi.fn(),
    onShare: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
  render(<ThemTab {...props} />);
  return props;
}

// ---------------------------------------------------------------------------
// JUS-432: AI insight feedback — 5 stars + free comment
// ---------------------------------------------------------------------------

describe('ThemTab — AI insight feedback', () => {
  it('shows five stars and reports the clicked rating', () => {
    const props = renderTab();
    for (let n = 1; n <= 5; n++) expect(screen.getByTestId(`rating-star-${n}`)).toBeTruthy();
    fireEvent.click(screen.getByTestId('rating-star-4'));
    expect(props.onRatingChange).toHaveBeenCalledWith(4);
  });

  it('disables Send until a rating is chosen', () => {
    renderTab();
    expect(screen.getByTestId('feedback-submit')).toBeDisabled();
  });

  it('sends feedback once rated, with the comment box editable', () => {
    const props = renderTab({ feedbackRating: 3 });
    fireEvent.change(screen.getByTestId('feedback-comment'), { target: { value: 'Too generic' } });
    expect(props.onCommentChange).toHaveBeenCalledWith('Too generic');
    fireEvent.click(screen.getByTestId('feedback-submit'));
    expect(props.onFeedbackSubmit).toHaveBeenCalled();
  });

  it('shows a thank-you after saving, and offers a refine for low ratings with a comment', () => {
    renderTab({ feedbackStatus: 'saved', feedbackRating: 2, feedbackComment: 'Too generic' });
    expect(screen.getByTestId('feedback-saved')).toBeTruthy();
    expect(screen.getByText('Refine analysis using my comment')).toBeTruthy();
  });

  it('shows an error when saving failed', () => {
    renderTab({ feedbackStatus: 'error', feedbackRating: 5 });
    expect(screen.getByTestId('feedback-error')).toBeTruthy();
  });

  it('cannot be sent when the report was not saved', () => {
    renderTab({ feedbackStatus: 'unavailable', feedbackRating: 5 });
    expect(screen.getByTestId('feedback-submit')).toBeDisabled();
  });
});
