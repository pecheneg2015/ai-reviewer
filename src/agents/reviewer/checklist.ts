import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { safeLLMCall } from '../../utils/retry.js';

const CHECKLIST_PROMPT = PromptTemplate.fromTemplate(`Ты — старший разработчик, который составляет чек-лист для ревью пул-реквеста.
Извлеки из стандартов команды КОНКРЕТНЫЕ ПРОВЕРЯЕМЫЕ ПРАВИЛА.
Каждый пункт должен быть сформулирован так, чтобы по диффу можно было однозначно сказать: нарушено или нет.

## Контекст
Проект: React + TypeScript, функциональные компоненты с хуками.
Проверяемые файлы: .tsx (компоненты) и .ts (утилиты, хуки).

## Что включать
- Правила именования (переменные, функции, компоненты, обработчики)
- Запрещённые паттерны в коде
- Требования к структуре компонента
- Правила работы с DOM и атрибутами

## Что НЕ включать
- Безопасность (токены, localStorage, права доступа)
- CI/CD
- Инфраструктура
- Заголовки h1-h6

## Важно
- Не придумывай правила, которых нет в стандартах
- Не extrapolate — только то, что явно написано
- Если правило нельзя проверить по диффу — не включай
- Если формулировка размытая — пропусти

## Стандарты команды
{rulesText}

Верни ТОЛЬКО JSON-массив. Без markdown-блоков, без пояснений, без \`\`\`json.
Начинай ответ с символа [ и заканчивай символом ].
Формат:
["правило 1", "правило 2", "правило 3"]`);

export async function generateChecklist(rulesText: string): Promise<string[]> {
  console.log('2.5️⃣ Генерация чек-листа...');

  const llm = new ChatOllama({
    model: process.env.OLLAMA_LLM_MODEL || 'qwen2.5-coder:7b',
    baseUrl: process.env.OLLAMA_BASE_URL,
    temperature: 0,
  });

  const text = await safeLLMCall(
    async () => {
      const response = await llm.invoke(await CHECKLIST_PROMPT.format({ rulesText }));
      return typeof response.content === 'string' ? response.content : '';
    },
    '[]',
    'Чек-лист LLM'
  );

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const checklist = JSON.parse(jsonMatch[0]);
      console.log(`   Пунктов: ${checklist.length}`);
      for (const item of checklist) {
        console.log(`   - ${item}`);
      }
      return checklist;
    } catch {
      console.log('   ⚠️ Не удалось разобрать чек-лист');
    }
  }

  return [];
}
