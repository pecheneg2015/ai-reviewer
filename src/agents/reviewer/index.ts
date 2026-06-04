import { fetchDiff } from './fetch-diff.js';
import { fetchRules } from './fetch-rules.js';
import { generateChecklist } from './checklist.js';
import { analyzeFile } from './analyze.js';
import { postResults } from './post-results/index.js';
import type { ReviewerInput, ReviewerResult } from './types.js';

export async function reviewPR(input: ReviewerInput): Promise<ReviewerResult> {
  console.log('📥 Агент-анализатор: анализ PR...\n');
  const startTime = Date.now();

  // 1. Дифф
  const files = await fetchDiff(input.prNumber);
  if (files.length === 0) {
    return { reviewResult: 'ℹ️ PR не содержит изменений.', reviewDone: true };
  }

  // 2. Правила
  const rulesText = await fetchRules();
  if (!rulesText) {
    return { reviewResult: '❌ Не удалось загрузить правила.', reviewDone: true };
  }

  // 3. Чек-лист
  const checklist = await generateChecklist(rulesText);
  if (checklist.length === 0) {
    return { reviewResult: '❌ Не удалось составить чек-лист.', reviewDone: true };
  }

  // 4. Анализ каждого файла
  const allViolations: Array<any> = [];
  for (const file of files) {
    const violations = await analyzeFile(file, checklist);
    allViolations.push(...violations);
    console.log('');
  }

  // 5. Публикация + HITL
  const reviewResult = await postResults(allViolations, input.prNumber, startTime);

  return { reviewResult, reviewDone: true };
}
