import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { safeLLMCall } from '../utils/retry.js';

export type AgentRoute = 'retrieve' | 'analyze_diff';

export async function supervisorDecision(mode: string, prNumber: number, question: string): Promise<AgentRoute> {
  console.log('👔 Супервизор: выбор агента...');

  const llm = new ChatOllama({
    model: process.env.OLLAMA_LLM_MODEL || 'qwen2.5-coder:7b',
    baseUrl: process.env.OLLAMA_BASE_URL,
    temperature: 0,
  });

  const SUPERVISOR_PROMPT = PromptTemplate.fromTemplate(`Ты — супервизор AI-системы код-ревью.
Выбери, какой агент должен обработать запрос.

## Доступные агенты
- **retrieve** — поиск по документам и ответ на вопрос (для команды "ask")
- **analyze_diff** — анализ пул-реквеста и публикация комментариев (для команды "review")

## Запрос
Режим: {mode}
PR: {prNumber}
Вопрос: {question}

Ответь одним словом: "retrieve" или "analyze_diff".`);

  const formattedPrompt = await SUPERVISOR_PROMPT.format({ mode, prNumber, question: question || '(нет)' });

  const decision = await safeLLMCall(
    async () => {
      const res = await llm.invoke(formattedPrompt);
      return typeof res.content === 'string' ? res.content.trim().toLowerCase() : '';
    },
    mode === 'review' ? 'analyze_diff' : 'retrieve',
    'Супервизор'
  );

  const route: AgentRoute = decision === 'analyze_diff' ? 'analyze_diff' : 'retrieve';
  console.log(`   Решение: ${route}`);
  return route;
}
