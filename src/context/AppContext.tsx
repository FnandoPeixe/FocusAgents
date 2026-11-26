import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GeneralRules,
  MonitoredApp,
  RuleSuggestion,
  SessionRecord,
} from '../types/focusAgents';

const STORAGE_KEY = '@focus_agents_state_v1';

interface AppContextData {
  apps: MonitoredApp[];
  rules: GeneralRules;
  sessions: SessionRecord[];
  pendingSuggestion: RuleSuggestion | null;
  toggleAppMonitored: (appId: string) => void;
  setAppScrollLimit: (appId: string, minutes: number) => void;
  addMonitoredApp: (name: string, scrollLimitMinutes?: number) => void;
  updateGeneralRules: (partial: Partial<GeneralRules>) => void;
  approveSuggestion: () => void;
  dismissSuggestion: () => void;
  recordSession: (session: Omit<SessionRecord, 'id' | 'timestamp'>) => void;
}

const INITIAL_APPS: MonitoredApp[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@feed',
    monitored: true,
    scrollLimitMinutes: 15,
    sessionsToday: 8,
    peakWindow: '20–21h',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@para-voce',
    monitored: true,
    scrollLimitMinutes: 15,
    sessionsToday: 6,
    peakWindow: '12–13h',
  },
  {
    id: 'x',
    name: 'X',
    handle: '@timeline',
    monitored: false,
    scrollLimitMinutes: 15,
    sessionsToday: 4,
    peakWindow: '7–8h',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@shorts',
    monitored: true,
    scrollLimitMinutes: 20,
    sessionsToday: 3,
    peakWindow: '18–19h',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    handle: '@r/all',
    monitored: false,
    scrollLimitMinutes: 15,
    sessionsToday: 2,
    peakWindow: '22–23h',
  },
];

const INITIAL_RULES: GeneralRules = {
  eveningLimitMinutes: 30,
  gentleScrollAlerts: true,
  confirmBeforeRuleChanges: true,
};

const INITIAL_SESSIONS: SessionRecord[] = [
  { id: '1', appId: 'instagram', appName: 'Instagram', durationMinutes: 22, scrollSpikes: 4, period: 'evening', timestamp: 'Ontem 21:10' },
  { id: '2', appId: 'tiktok', appName: 'TikTok', durationMinutes: 18, scrollSpikes: 5, period: 'afternoon', timestamp: 'Ontem 12:30' },
  { id: '3', appId: 'instagram', appName: 'Instagram', durationMinutes: 16, scrollSpikes: 2, period: 'evening', timestamp: 'Hoje 20:15' },
  { id: '4', appId: 'youtube', appName: 'YouTube', durationMinutes: 16, scrollSpikes: 3, period: 'evening', timestamp: 'Hoje 18:40' },
];

const INITIAL_SUGGESTION: RuleSuggestion = {
  id: 'sug-initial-evening',
  title: 'Reduzir limite noturno para 20m?',
  description: 'De 30m para 20m · Só com sua autorização.',
  target: 'eveningLimitMinutes',
  currentValue: 30,
  suggestedValue: 20,
  reason: 'A rolagem noturna caiu 35% esta semana.',
};

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apps, setApps] = useState<MonitoredApp[]>(INITIAL_APPS);
  const [rules, setRules] = useState<GeneralRules>(INITIAL_RULES);
  const [sessions, setSessions] = useState<SessionRecord[]>(INITIAL_SESSIONS);
  const [pendingSuggestion, setPendingSuggestion] = useState<RuleSuggestion | null>(
    INITIAL_SUGGESTION
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.apps) setApps(parsed.apps);
        if (parsed.rules) setRules(parsed.rules);
        if (parsed.sessions) setSessions(parsed.sessions);
        if ('pendingSuggestion' in parsed) setPendingSuggestion(parsed.pendingSuggestion);
      } catch {
        // ignora estado corrompido
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ apps, rules, sessions, pendingSuggestion })
    );
  }, [apps, rules, sessions, pendingSuggestion]);

  const toggleAppMonitored = (appId: string) => {
    setApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, monitored: !app.monitored } : app))
    );
  };

  const setAppScrollLimit = (appId: string, minutes: number) => {
    setApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, scrollLimitMinutes: minutes } : app))
    );
  };

  const addMonitoredApp = (name: string, scrollLimitMinutes = 15) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const id = `${cleanName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    setApps((prev) => [
      ...prev,
      {
        id,
        name: cleanName,
        handle: `@${cleanName.toLowerCase().replace(/\s+/g, '')}`,
        monitored: true,
        scrollLimitMinutes,
        sessionsToday: 0,
        peakWindow: '—',
      },
    ]);
  };

  const updateGeneralRules = (partial: Partial<GeneralRules>) => {
    setRules((prev) => ({ ...prev, ...partial }));
  };

  const approveSuggestion = () => {
    if (!pendingSuggestion) return;
    if (pendingSuggestion.target === 'eveningLimitMinutes') {
      setRules((prev) => ({
        ...prev,
        eveningLimitMinutes: pendingSuggestion.suggestedValue,
      }));
    } else if (pendingSuggestion.target === 'appScrollLimit' && pendingSuggestion.appId) {
      setAppScrollLimit(pendingSuggestion.appId, pendingSuggestion.suggestedValue);
    }
    setPendingSuggestion(null);
  };

  const dismissSuggestion = () => {
    setPendingSuggestion(null);
  };

  const recordSession = (session: Omit<SessionRecord, 'id' | 'timestamp'>) => {
    const newRecord: SessionRecord = {
      ...session,
      id: String(Date.now()),
      timestamp: 'Agora',
    };
    setSessions((prev) => [newRecord, ...prev]);
    setApps((prev) =>
      prev.map((app) =>
        app.id === session.appId
          ? { ...app, sessionsToday: app.sessionsToday + 1 }
          : app
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        apps,
        rules,
        sessions,
        pendingSuggestion,
        toggleAppMonitored,
        setAppScrollLimit,
        addMonitoredApp,
        updateGeneralRules,
        approveSuggestion,
        dismissSuggestion,
        recordSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);