import { requiresHumanReview } from '../../../guards/criticality-classifier.js';
import type { Criticality } from '../../../guards/criticality-classifier.js';
import { saveRecord, type ReviewRecord } from '../../../utils/memory.js';
import type { Violation } from './types.js';

export function buildAndSaveRecord(
  violations: Violation[],
  prNumber: number,
  autoCount: number,
  hitlConfirmed: number,
  hitlSkipped: number,
  durationSec: number,
): void {
  const record: ReviewRecord = {
    timestamp: new Date().toISOString(),
    prNumber,
    mode: process.env.USE_REAL_GITHUB_API === 'true' ? 'real' : 'mock',
    violationsFound: violations.length,
    autoComments: autoCount,
    hitlConfirmed,
    hitlSkipped,
    durationSec,
    violations: violations.map((v) => ({
      file: v.file,
      line: v.line,
      text: v.text,
      criticality: v.criticality,
      posted: v.posted,
    })),
  };

  saveRecord(record);
}

export function formatReviewResult(
  violations: Violation[],
  autoCount: number,
  hitlConfirmed: number,
  hitlSkipped: number,
): string {
  const hitlCount = violations.filter((v) => requiresHumanReview(v.criticality as Criticality)).length;

  const header = [
    `📊 Найдено нарушений: ${violations.length}`,
    `💬 Авто-комментариев: ${autoCount}`,
    `⏳ Требуют подтверждения (HITL): ${hitlCount}`,
    `✅ Подтверждено: ${hitlConfirmed}`,
    `❌ Пропущено: ${hitlSkipped}`,
  ].join('\n');

  const details = violations
    .map((v) => `   ${v.posted ? '✅' : '⏳'} [${v.file}:${v.line}] ${v.text} [${v.criticality}]`)
    .join('\n');

  return `${header}\n\n${details}`;
}
