import { createLLM } from '../llm-factory.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { safeLLMCall } from '../utils/retry.js';

export type AgentRoute = 'retrieve' | 'analyze_diff' | 'security' | 'done';

export interface SupervisorState {
  mode: string;
  prNumber: number;
  question: string;
  securityDone: boolean;
  securityPassed: boolean;
  reviewDone: boolean;
  reviewResult: string;
  reviewPass: number;
  maxReviewPasses: number;
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

  // Ревьюер отработал — проверяем, нужен ли ещё проход
  if (state.reviewPass < state.maxReviewPasses) {
    console.log(`   Решение: analyze_diff (проход ${state.reviewPass + 1}/${state.maxReviewPasses})`);
    return 'analyze_diff';
  }

  // Все проходы завершены — анализируем результат через LLM
  const llm = await createLLM();

  const SUPERVISOR_PROMPT = PromptTemplate.fromTemplate(`Ты — супервизор AI-системы код-ревью.
Проанализируй результат ревью и реши, что делать дальше.

## Результат ревью (проход {reviewPass}/{maxReviewPasses})
{reviewResult}

## Доступные действия
- **retrieve** — ревью завершён, нужно сгенерировать финальный ответ с результатами
- **done** — работа завершена

Ответь одним словом: retrieve или done.`);

  const formattedPrompt = await SUPERVISOR_PROMPT.format({
    reviewResult: state.reviewResult || '(пусто)',
    reviewPass: state.reviewPass,
    maxReviewPasses: state.maxReviewPasses,
  });

  const decision = await safeLLMCall(
    async () => {
      const res = await llm.invoke(formattedPrompt);
      return typeof res.content === 'string' ? res.content.trim().toLowerCase() : '';
    },
    'done',
    'Супервизор'
  );

  const route: AgentRoute = decision === 'retrieve' ? 'retrieve' : 'done';
  console.log(`   Решение: ${route}`);
  return route;
}
