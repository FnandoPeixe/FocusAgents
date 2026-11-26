import { GeneralRules, MonitoredApp, SessionRecord } from '../types/focusAgents';

export interface RuleEvaluationResult {
  shouldIntervene: boolean;
  reason?: string;
  triggeredRule?: string;
}

/**
 * Lógica determinística: verifica limites configurados e ritmo de rolagem.
 * Não depende de LLM; garante previsibilidade e controle do usuário.
 */
export function evaluateSessionRules(params: {
  app: MonitoredApp;
  elapsedSeconds: number;
  rapidScrollCount: number;
  rules: GeneralRules;
  isEvening: boolean;
}): RuleEvaluationResult {
  const { app, elapsedSeconds, rapidScrollCount, rules, isEvening } = params;

  if (!app.monitored || !rules.gentleScrollAlerts) {
    return { shouldIntervene: false };
  }

  const elapsedMinutes = elapsedSeconds / 60;

  if (isEvening && elapsedMinutes >= rules.eveningLimitMinutes) {
    return {
      shouldIntervene: true,
      reason: `Você atingiu seu limite noturno de ${rules.eveningLimitMinutes} min no ${app.name}.`,
      triggeredRule: `Limite noturno (${rules.eveningLimitMinutes}m)`,
    };
  }

  if (elapsedMinutes >= app.scrollLimitMinutes) {
    return {
      shouldIntervene: true,
      reason: `Você está rolando o feed do ${app.name} há ${Math.floor(elapsedMinutes)} min.`,
      triggeredRule: `Limite do app (${app.scrollLimitMinutes}m)`,
    };
  }

  // Detecta padrão de rolagem contínua/rápida na sessão atual
  if (rapidScrollCount >= 8) {
    return {
      shouldIntervene: true,
      reason: `Notamos um ritmo de rolagem contínua no ${app.name}.`,
      triggeredRule: 'Ritmo de scrolling automático',
    };
  }

  return { shouldIntervene: false };
}

export function calculateWeeklyStats(sessions: SessionRecord[]) {
  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalSpikes = sessions.reduce((acc, s) => acc + s.scrollSpikes, 0);
  const eveningMinutes = sessions
    .filter((s) => s.period === 'evening')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  return { totalMinutes, totalSpikes, eveningMinutes };
}