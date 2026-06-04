import { createLLM } from '../../llm-factory.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { safeLLMCall } from '../../utils/retry.js';
import { classifyViolation } from '../../guards/criticality-classifier.js';
import type { DiffFile, Violation } from './types.js';

const REVIEW_PROMPT = PromptTemplate.fromTemplate(`Ты — строгий ревьюер React-проекта на TypeScript.
Твоя задача: найти ВСЕ нарушения чек-листа в диффе.

## Контекст
- Функциональные компоненты React
- TypeScript
- Стилизация: CSS-модули
- Тесты: Vitest + React Testing Library

## Инструкция по чтению диффа
- Строки с + — новый код (проверяем ТОЛЬКО их)
- Строки с - — старый код (игнорируем)
- Строка @@ -a,b +c,d @@ — новый код начинается со строки c
- Строка +++ b/... — заголовок файла (не проверяем)
- Проверяй КАЖДУЮ строку с + на соответствие КАЖДОМУ пункту чек-листа

## Важно
- Только явные нарушения
- Не интерпретируй код вольно
- Если сомневаешься — это не нарушение

## Чек-лист
{checklist}

## Дифф файла {filename}
{diff}

Верни ТОЛЬКО JSON:
{{
  "violations": [
    {{ "line": <число>, "rule": "<формулировка из чек-листа>" }}
  ]
}}

Если нарушений нет:
{{
  "violations": []
}}`);

export async function analyzeFile(
  file: DiffFile,
  checklist: string[]
): Promise<Violation[]> {
  console.log(`📄 ${file.filename}`);

  if (!file.patch || file.patch === '(бинарный файл или нет изменений)') {
    console.log('   Пропущен');
    return [];
  }

  const llm = await createLLM();


  const formattedPrompt = await REVIEW_PROMPT.format({
    checklist: checklist.map((c, i) => `${i + 1}. ${c}`).join('\n'),
    filename: file.filename,
    diff: file.patch,
  });

  console.log('   🧠 LLM-анализ...');

  const text = await safeLLMCall(
    async () => {
      const response = await llm.invoke(formattedPrompt);
      return typeof response.content === 'string' ? response.content : '';
    },
    '{"violations": []}',
    'Анализ LLM'
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log(`   ⚠️ Не удалось извлечь JSON`);
    return [];
  }

  try {
    const result = JSON.parse(jsonMatch[0]);
    const fileViolations = result.violations || [];

    if (fileViolations.length === 0) {
      console.log('   ✅ Нарушений нет');
      return [];
    }

    return fileViolations.map((v: any) => ({
      file: file.filename,
      line: v.line,
      text: v.rule,
      criticality: classifyViolation(v.rule),
      posted: false,
    }));
  } catch {
    console.log(`   ⚠️ Ошибка парсинга JSON`);
    return [];
  }
}
