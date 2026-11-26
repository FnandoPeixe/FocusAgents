export type AgentType = 'analyst' | 'guide' | 'reflective';

export type IntentionTag = 'Relaxar' | 'Inspiração' | 'Tédio' | 'Personalizado';

export interface MonitoredApp {
  id: string;
  name: string;
  handle: string;
  monitored: boolean;
  scrollLimitMinutes: number; // ex.: 10, 15, 20
  sessionsToday: number;
  peakWindow: string;
}

export interface SessionRecord {
  id: string;
  appId: string;
  appName: string;
  durationMinutes: number;
  scrollSpikes: number; // picos de rolagem contínua
  period: 'morning' | 'afternoon' | 'evening';
  timestamp: string;
}

export interface GeneralRules {
  eveningLimitMinutes: number; // 10 a 60
  gentleScrollAlerts: boolean;
  confirmBeforeRuleChanges: boolean;
}

export interface RuleSuggestion {
  id: string;
  title: string;
  description: string;
  target: 'eveningLimitMinutes' | 'appScrollLimit';
  appId?: string;
  currentValue: number;
  suggestedValue: number;
  reason: string;
}

export interface GuideRecommendation {
  acknowledgment: string;
  alternatives: {
    id: string;
    title: string;
    subtitle: string;
  }[];
}