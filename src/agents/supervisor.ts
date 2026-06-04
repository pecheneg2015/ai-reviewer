import { PromptTemplate } from '@langchain/core/prompts';
import { safeLLMCall } from '../utils/retry.js';
import { createLLM } from '../llm-factory.js';

export type AgentRoute = 'retrieve' | 'analyze_diff' | 'security' | 'done';

export interface SupervisorState {
  mode: string;
  prNumber: number;
  question: string;
  securityDone: boolean;
  securityPassed: boolean;
  reviewDone: boolean;
  reviewResult: string;
}

export async function supervisorDecision(state: SupervisorState): Promise<AgentRoute> {
  console.log('👔 Супервизор: анализ ситуации...');

  // Режим ask — сразу поиск
  if (state.mode === 'ask') {
    console.log('   Решение: retrieve');
    return 'retrieve';
  }

  // Безопасник заблокировал — конец
  if (state.securityDone && !state.securityPassed) {
    console.log('   Решение: done (блокировка безопасности)');
    return 'done';
  }

  // Безопасник не запущен — запускаем
  if (!state.securityDone) {
    console.log('   Решение: security');
    return 'security';
  }

  // Ревьюер не запущен — запускаем
  if (!state.reviewDone) {
    console.log('   Решение: analyze_diff');
    return 'analyze_diff';
  }

  // Ревьюер отработал — анализируем результат через LLM
  const llm = await createLLM();

  // const llm = new ChatOllama({
  //   model: process.env.OLLAMA_LLM_MODEL || 'qwen2.5-coder:7b',
  //   baseUrl: process.env.OLLAMA_BASE_URL,
  //   temperature: 0,
  // });

  const SUPERVISOR_PROMPT = PromptTemplate.fromTemplate(`Ты — супервизор AI-системы код-ревью.
Проанализируй результат ревью и реши, что делать дальше.

## Результат ревью
{reviewResult}

## Доступные действия
- **retrieve** — ревью завершён, нужно сгенерировать финальный ответ с результатами
- **analyze_diff** — результат неполный или есть ошибки, нужно повторить анализ
- **done** — работа завершена

Ответь одним словом: retrieve, analyze_diff или done.`);

  const formattedPrompt = await SUPERVISOR_PROMPT.format({
    reviewResult: state.reviewResult || '(пусто)',
  });

  const decision = await safeLLMCall(
    async () => {
      const res = await llm.invoke(formattedPrompt);
      return typeof res.content === 'string' ? res.content.trim().toLowerCase() : '';
    },
    'done',
    'Супервизор'
  );

  const route: AgentRoute =
    decision === 'retrieve' ? 'retrieve' :
      decision === 'analyze_diff' ? 'analyze_diff' :
        'done';

  console.log(`   Решение: ${route}`);
  return route;
}
