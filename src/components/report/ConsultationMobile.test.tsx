/// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ConsultationMobile from './ConsultationMobile';
import type { Persona, Language } from '../../types';

afterEach(cleanup);

const makePersona = (): Persona =>
  ({
    communication_challenge: { en: 'You tend to go deep fast', he: 'אתה נוטה ללכת לעומק מהר' },
    adhd_challenge: { en: 'Hyperfocus can isolate you', he: 'היפרפוקוס עלול לבודד אותך' },
    consultation_benefit: { en: 'Get a tailored playbook', he: 'קבל חוברת משחק מותאמת' },
  } as unknown as Persona);

const makeT = () => ({
  report: {
    cta: {
      title: 'Work With Me',
      btn: 'Schedule a Session',
      more_details: 'More details',
    },
    adhd_title: 'ADHD Angle',
  },
});

const defaultProps = {
  persona: makePersona(),
  colors: { accent: 'text-purple-300', from: 'from-purple-500' } as any,
  language: 'en' as Language,
  t: makeT(),
  onTrack: vi.fn(),
  showAdhd: false,
};

// ─── Smoke ────────────────────────────────────────────────────────────────────

describe('ConsultationMobile', () => {
  it('renders without throwing', () => {
    render(<ConsultationMobile {...defaultProps} />);
  });

  it('renders the CTA title', () => {
    render(<ConsultationMobile {...defaultProps} />);
    expect(screen.getByText('Work With Me')).toBeTruthy();
  });

  it('renders the schedule button with correct href', () => {
    render(<ConsultationMobile {...defaultProps} />);
    const link = screen.getByText('Schedule a Session').closest('a');
    expect(link?.href).toContain('magicalhq.com');
  });

  // ─── Mobile-responsive padding ────────────────────────────────────────────

  it('outer container has p-4 class for mobile padding', () => {
    const { container } = render(<ConsultationMobile {...defaultProps} />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain('p-4');
  });

  it('outer container has sm:p-8 class for desktop padding', () => {
    const { container } = render(<ConsultationMobile {...defaultProps} />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain('sm:p-8');
  });

  // ─── ADHD conditional content ─────────────────────────────────────────────

  it('hides ADHD badge when showAdhd is false', () => {
    render(<ConsultationMobile {...defaultProps} showAdhd={false} />);
    expect(screen.queryByText('ADHD Insight')).toBeNull();
  });

  it('shows ADHD badge when showAdhd is true', () => {
    render(<ConsultationMobile {...defaultProps} showAdhd={true} />);
    expect(screen.getByText('ADHD Insight')).toBeTruthy();
  });

  it('shows communication challenge text when showAdhd is true', () => {
    render(<ConsultationMobile {...defaultProps} showAdhd={true} />);
    expect(screen.getByText('You tend to go deep fast')).toBeTruthy();
  });

  // ─── Click tracking ───────────────────────────────────────────────────────

  it('calls onTrack("schedule") when CTA link is clicked', () => {
    const onTrack = vi.fn();
    render(<ConsultationMobile {...defaultProps} onTrack={onTrack} />);
    const btn = screen.getByText('Schedule a Session');
    fireEvent.click(btn);
    expect(onTrack).toHaveBeenCalledWith('schedule');
  });

  it('calls onTrack("website") when website link is clicked', () => {
    const onTrack = vi.fn();
    render(<ConsultationMobile {...defaultProps} onTrack={onTrack} />);
    const link = screen.getByText('More details');
    fireEvent.click(link);
    expect(onTrack).toHaveBeenCalledWith('website');
  });
});
