import { loadHistory, type ReviewRecord } from './memory.js';
import { createLLM } from '../llm-factory.js';
import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Анализирует историю проверок и возвращает контекст для ревьюера.
 * LLM ищет паттерны: частые нарушения, проблемные файлы, типичные ошибки.
 */
export async function getHistoricalContext(
  filename: string,
  maxRecords: number = 10
): Promise<string> {
  const history = loadHistory().slice(0, maxRecords);

  if (history.length === 0) {
    return '';
  }

  // Формируем сводку для LLM
  const historySummary = history
    .map((r) => {
      const violationsSummary = r.violations
        .map((v) => `  - [${v.file}:${v.line}] ${v.text} (${v.criticality})`)
        .join('\n');
      return `PR #${r.prNumber} (${r.timestamp}):\n${violationsSummary}`;
    })
    .join('\n\n');

  const llm = await createLLM();

  const MEMORY_PROMPT = PromptTemplate.fromTemplate(`Проанализируй историю проверок и выдели паттерны.

## История проверок
{historySummary}

## Текущий файл для проверки
{filename}

## Задача
1. Найди повторяющиеся типы нарушений
2. Отметь проблемные паттерны, характерные для этого проекта
3. Напиши краткую памятку для ревьюера: на что обратить особое внимание

Ответь кратко (2-4 предложения) на русском языке.`);

  const response = await llm.invoke(
    await MEMORY_PROMPT.format({ historySummary, filename })
  );

  const context = typeof response.content === 'string' ? response.content : '';

  if (context) {
    console.log(`   🧠 Контекст из истории: ${context.slice(0, 100)}...`);
  }

  return context;
}
