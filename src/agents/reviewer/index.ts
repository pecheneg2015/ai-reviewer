import { fetchDiff } from './fetch-diff.js';
import { fetchRules } from './fetch-rules.js';
import { generateChecklist } from './checklist.js';
import { analyzeFile } from './analyze.js';
import { postResults } from './post-results/index.js';
import { getHistoricalContext } from '../../utils/context-memory.js';
import type { ReviewerInput, ReviewerResult } from './types.js';

export async function reviewPR(input: ReviewerInput): Promise<ReviewerResult> {
  console.log('📥 Агент-анализатор: анализ PR...\n');
  const startTime = Date.now();

  // 1. Дифф
  const files = await fetchDiff(input.prNumber);
  if (files.length === 0) {
    return { reviewResult: 'ℹ️ PR не содержит изменений.', reviewDone: true };
  }

  // 2. Контекст из истории проверок
  const historicalContext = await getHistoricalContext(
    files.map((f) => f.filename).join(', '),
    10
  );

  // 3. Правила
  const rulesText = await fetchRules();
  if (!rulesText) {
    return { reviewResult: '❌ Не удалось загрузить правила.', reviewDone: true };
  }

  // 4. Чек-лист
  const checklist = await generateChecklist(rulesText);
  if (checklist.length === 0) {
    return { reviewResult: '❌ Не удалось составить чек-лист.', reviewDone: true };
  }

  // 5. Анализ каждого файла (с историческим контекстом)
  const allViolations: Array<any> = [];
  for (const file of files) {
    const violations = await analyzeFile(file, checklist, historicalContext);
    allViolations.push(...violations);
    console.log('');
  }

  // 6. Публикация + HITL
  const reviewResult = await postResults(allViolations, input.prNumber, startTime);

  return { reviewResult, reviewDone: true };
}
