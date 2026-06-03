import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const MEMORY_DIR = join(process.cwd(), 'data', 'memory');
const HISTORY_FILE = join(MEMORY_DIR, 'review-history.json');
const MAX_HISTORY = 20;

// ---------------------------------------------------------------------------
// Типы
// ---------------------------------------------------------------------------

export interface ReviewRecord {
  timestamp: string;
  prNumber: number;
  mode: 'real' | 'mock';
  violationsFound: number;
  autoComments: number;
  hitlConfirmed: number;
  hitlSkipped: number;
  durationSec: number;
  violations: Array<{
    file: string;
    line: number;
    text: string;
    criticality: string;
    posted: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// Инициализация
// ---------------------------------------------------------------------------

function ensureMemoryDir(): void {
  if (!existsSync(MEMORY_DIR)) {
    mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Чтение / запись
// ---------------------------------------------------------------------------

export function loadHistory(): ReviewRecord[] {
  ensureMemoryDir();

  if (!existsSync(HISTORY_FILE)) {
    return [];
  }

  try {
    const raw = readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw) as ReviewRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(record: ReviewRecord): void {
  ensureMemoryDir();

  const history = loadHistory();
  history.unshift(record);

  // Ограничиваем размер истории
  const trimmed = history.slice(0, MAX_HISTORY);

  writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  console.log(`   💾 Запись сохранена в историю (всего: ${trimmed.length})`);
}

// ---------------------------------------------------------------------------
// Отображение
// ---------------------------------------------------------------------------

export function formatHistory(records: ReviewRecord[]): string {
  if (records.length === 0) {
    return '📭 История проверок пуста.';
  }

  const lines: string[] = [
    `📋 История проверок (последние ${records.length}):`,
    '━'.repeat(60),
  ];

  for (const r of records) {
    const date = new Date(r.timestamp).toLocaleString('ru-RU');
    lines.push(
      `${date} | PR #${r.prNumber} | ${r.mode === 'real' ? '🌐 GitHub' : '📦 Mock'} | ` +
      `Нарушений: ${r.violationsFound} | Авто: ${r.autoComments} | HITL: ${r.hitlConfirmed}/${r.hitlConfirmed + r.hitlSkipped} | ` +
      `${r.durationSec} сек.`
    );
  }

  lines.push('━'.repeat(60));
  return lines.join('\n');
}

export function formatLastRecord(record: ReviewRecord): string {
  const lines: string[] = [
    '',
    '📋 Детали последней проверки:',
    '━'.repeat(40),
    `PR: #${record.prNumber}`,
    `Режим: ${record.mode === 'real' ? 'GitHub' : 'Mock'}`,
    `Время: ${record.durationSec} сек.`,
    `Нарушений: ${record.violationsFound}`,
    `Авто-комментариев: ${record.autoComments}`,
    `HITL подтверждено: ${record.hitlConfirmed}`,
    `HITL пропущено: ${record.hitlSkipped}`,
  ];

  if (record.violations.length > 0) {
    lines.push('', 'Нарушения:');
    for (const v of record.violations) {
      const status = v.posted ? '✅' : '⏳';
      lines.push(`   ${status} [${v.file}:${v.line}] ${v.text} [${v.criticality}]`);
    }
  }

  lines.push('━'.repeat(40));
  return lines.join('\n');
}
