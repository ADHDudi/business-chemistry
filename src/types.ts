
export type Language = 'he' | 'en';

export enum AxisType {
  FORMAL = "formal",
  DOMINANT = "dominant"
}

export interface BilingualText {
  he: string;
  en: string;
}

export interface Trait {
  id: number;
  left: BilingualText;
  right: BilingualText;
  axis: AxisType;
  reverse: boolean;
}

export interface Persona {
  key: string;
  title: BilingualText;
  role: BilingualText;
  icon: string; // Icon name for dynamic rendering
  color: 'red' | 'green' | 'yellow' | 'blue';
  description: BilingualText;
  strengths: { he: string[]; en: string[] };
  tips: { he: string[]; en: string[] };
  communication_challenge: BilingualText;
  adhd_challenge: BilingualText;
  consultation_benefit: BilingualText;
}

export interface User {
  name: string;
  email: string;
}

export interface Results {
  formal: string;
  dominant: string;
  profileData: Array<Trait & { rawScore: number; normalizedScore: number }>;
}

export interface CompatibilityAnalysis {
  score: number;
  friction_points: string[];
  synergies: string[];
  verdict: string;
}

export interface AICommunicationCoach {
  user_profile: {
    type: string;
    superpower: string;
    kryptonite: string;
    challenges?: Array<{
      title: string;
      description: string;
      watch_for: string;
    }>;
  };
  interaction_guide: {
    target_profile: string;
    friction_point: string;
    common_ground?: string;
    their_motivation?: string;
    motivation_gap?: string;
    strategy_card: {
      title: string;
      action: string;
      script: string;
    };
  };
  executive_function_tool: {
    tool_name: string;
    instruction: string;
    template_ready: boolean;
  };
  position_narrative?: string;
}