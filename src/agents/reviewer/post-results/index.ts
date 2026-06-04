import { postAutoComments } from './auto-comment.js';
import { processHITL } from './hitl.js';
import { buildAndSaveRecord, formatReviewResult } from './save-review.js';
import type { Violation } from './types.js';

export async function postResults(
  violations: Violation[],
  prNumber: number,
  startTime: number,
): Promise<string> {
  if (violations.length === 0) {
    return '✅ Нарушений не найдено.';
  }

  // Авто-комментарии
  const autoCount = await postAutoComments(violations, prNumber);

  // HITL
  const { confirmed, skipped } = await processHITL(violations, prNumber);

  // Сохранение
  const durationSec = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
  buildAndSaveRecord(violations, prNumber, autoCount, confirmed, skipped, durationSec);

  // Результат
  return formatReviewResult(violations, autoCount, confirmed, skipped);
}
