import {
  GuideRecommendation,
  IntentionTag,
  RuleSuggestion,
  SessionRecord,
} from '../types/focusAgents';

const OPENAI_API_KEY = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.EXPO_PUBLIC_OPENAI_API_KEY;

async function callLlmOrFallback<T>(
  systemPrompt: string,
  userPayload: unknown,
  fallbackFn: () => T
): Promise<T> {
  if (!OPENAI_API_KEY) {
    return fallbackFn();
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
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
    return content ? (JSON.parse(content) as T) : fallbackFn();
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
    })
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
    }
  );
}