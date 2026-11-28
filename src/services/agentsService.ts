import {
  GuideRecommendation,
  IntentionTag,
  RuleSuggestion,
  SessionRecord,
} from '../types/focusAgents';

const env = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env;

const CUSTOM_BASE_URL = env?.EXPO_PUBLIC_LLM_BASE_URL?.trim();
const FREE_CHAT_URL = 'https://flm.stonech.at/v1/chat/completions';

function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`;
}

function parseModelJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

async function callLlmOrFallback<T>(
  systemPrompt: string,
  userPayload: unknown,
  fallbackFn: () => T,
  isValid: (value: unknown) => value is T
): Promise<T> {
  const endpoint = CUSTOM_BASE_URL ? chatCompletionsUrl(CUSTOM_BASE_URL) : FREE_CHAT_URL;
  const apiKey = CUSTOM_BASE_URL
    ? env?.EXPO_PUBLIC_LLM_API_KEY?.trim() || env?.EXPO_PUBLIC_OPENAI_API_KEY?.trim()
    : undefined;
  const model =
    env?.EXPO_PUBLIC_LLM_MODEL?.trim() ||
    (CUSTOM_BASE_URL?.includes('openai.com') ? 'gpt-4o-mini' : 'auto');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userPayload) },
        ],
      }),
    });

    if (!response.ok) return fallbackFn();
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return fallbackFn();
    const parsed = parseModelJson(content);
    return isValid(parsed) ? parsed : fallbackFn();
  } catch {
    return fallbackFn();
  }
}

/**
 * 1. Agente Analista de Padrões: identifica padrões menos óbvios nas sessões.
 */
export async function analyzePatternsWithAgent(
  sessions: SessionRecord[]
): Promise<{ headline: string; insight: string }> {
  return callLlmOrFallback(
    'Você é o Agente Analista de Padrões de um app de bem-estar digital. Responda em JSON com {"headline": string, "insight": string} em português, tom calmo e objetivo.',
    { sessions },
    () => ({
      headline: 'Picos de rolagem no fim da tarde e noite',
      insight:
        'Sessões curtas e repetidas aparecem com maior frequência entre 18h e 22h, associadas a picos de rolagem contínua.',
    }),
    (value): value is { headline: string; insight: string } => {
      if (!value || typeof value !== 'object') return false;
      const record = value as { headline?: unknown; insight?: unknown };
      return typeof record.headline === 'string' && typeof record.insight === 'string';
    }
  );
}

/**
 * 2. Agente Orientador: interpreta a intenção do usuário e sugere alternativas sem julgamento.
 */
export async function guideUserWithAgent(params: {
  intention: IntentionTag;
  customText?: string;
  appName: string;
}): Promise<GuideRecommendation> {
  const { intention, customText, appName } = params;

  return callLlmOrFallback(
    'Você é o Agente Orientador. Nunca julgue ou bloqueie. Responda em JSON com {"acknowledgment": string, "alternatives": [{"id": string, "title": string, "subtitle": string}]} em português (2 alternativas curtas).',
    { intention, customText, appName },
    () => {
      if (customText && customText.trim().length > 0) {
        return {
          acknowledgment: `Entendi: "${customText.trim()}". Se quiser dar uma pausa antes de seguir no ${appName}, aqui vão duas opções leves:`,
          alternatives: [
            {
              id: 'breath-2m',
              title: 'Respiração de 2 min',
              subtitle: 'Desacelere os ombros e o olhar.',
            },
            {
              id: 'save-note',
              title: 'Anotar 1 ideia',
              subtitle: 'Registre o que veio à mente e feche o feed.',
            },
          ],
        };
      }

      if (intention === 'Relaxar') {
        return {
          acknowledgment: 'Buscar descanso faz sentido. Um feed rápido nem sempre relaxa tanto quanto uma pausa curta:',
          alternatives: [
            {
              id: 'saved-article',
              title: 'Ler artigo salvo',
              subtitle: 'Uma leitura com mais calma.',
            },
            {
              id: 'reset-5m',
              title: 'Pausa de 5 min',
              subtitle: 'Respire. Alongue. Volte.',
            },
          ],
        };
      }

      if (intention === 'Inspiração') {
        return {
          acknowledgment: 'Ótimo querer buscar repertório. Que tal uma micro-pausa para clarear o que você quer encontrar?',
          alternatives: [
            {
              id: 'mood-sketch',
              title: 'Rascunho rápido',
              subtitle: 'Escreva 3 palavras do que busca.',
            },
            {
              id: 'reset-5m',
              title: 'Pausa de 5 min',
              subtitle: 'Olhe para longe da tela por um instante.',
            },
          ],
        };
      }

      return {
        acknowledgment: 'O tédio costuma disparar o scrolling automático. Você está no comando da sua escolha:',
        alternatives: [
          {
            id: 'saved-article',
            title: 'Ler artigo salvo',
            subtitle: 'Uma leitura com mais calma.',
          },
          {
            id: 'reset-5m',
            title: 'Pausa de 5 min',
              subtitle: 'Respire. Alongue. Volte.',
          },
        ],
      };
    },
    (value): value is GuideRecommendation => {
      if (!value || typeof value !== 'object') return false;
      const record = value as GuideRecommendation;
      return (
        typeof record.acknowledgment === 'string' &&
        Array.isArray(record.alternatives) &&
        record.alternatives.length > 0 &&
        record.alternatives.every(
          (item) =>
            typeof item?.id === 'string' &&
            typeof item?.title === 'string' &&
            typeof item?.subtitle === 'string'
        )
      );
    }
  );
}

/**
 * 3. Agente Reflexivo: gera síntese e sugestão estruturada de ajuste de regra (exige aprovação).
 */
export async function generateReflectiveSuggestion(
  currentEveningLimit: number,
  sessions: SessionRecord[]
): Promise<{ summary: string; suggestion: RuleSuggestion | null }> {
  return callLlmOrFallback(
    'Você é o Agente Reflexivo. Gere um resumo semanal acolhedor e, se fizer sentido, uma sugestão de ajuste de regra em JSON: {"summary": string, "suggestion": {"id": string, "title": string, "description": string, "target": "eveningLimitMinutes", "currentValue": number, "suggestedValue": number, "reason": string}}.',
    { currentEveningLimit, sessionsCount: sessions.length },
    () => {
      const targetLimit = Math.max(10, currentEveningLimit - 10);
      return {
        summary:
          'Sua rolagem noturna caiu nesta semana e você manteve pausas mais conscientes nos horários de pico.',
        suggestion:
          currentEveningLimit > 15
            ? {
                id: 'sug-evening-1',
                title: `Reduzir limite noturno para ${targetLimit}m?`,
                description: `De ${currentEveningLimit}m para ${targetLimit}m · Só com sua autorização.`,
                target: 'eveningLimitMinutes',
                currentValue: currentEveningLimit,
                suggestedValue: targetLimit,
                reason: 'Suas sessões à noite têm sido mais curtas nos últimos dias.',
              }
            : null,
      };
    },
    (value): value is { summary: string; suggestion: RuleSuggestion | null } => {
      if (!value || typeof value !== 'object') return false;
      const record = value as { summary?: unknown; suggestion?: unknown };
      if (typeof record.summary !== 'string') return false;
      if (record.suggestion == null) return true;
      const suggestion = record.suggestion as RuleSuggestion;
      return (
        typeof suggestion.id === 'string' &&
        typeof suggestion.title === 'string' &&
        typeof suggestion.description === 'string' &&
        (suggestion.target === 'eveningLimitMinutes' || suggestion.target === 'appScrollLimit') &&
        typeof suggestion.currentValue === 'number' &&
        typeof suggestion.suggestedValue === 'number' &&
        typeof suggestion.reason === 'string'
      );
    }
  );
}