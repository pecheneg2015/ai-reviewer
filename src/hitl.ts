import readline from 'node:readline';

/**
 * Запрашивает у пользователя подтверждение действия.
 * Возвращает true для "одобрить", false для "отклонить".
 */
export async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} [y/n]: `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes' || normalized === 'да');
    });
  });
}

/**
 * Форматирует нарушение для вывода в консоли.
 */
export function formatViolationForHITL(
  violation: { file: string; line: number; text: string; criticality: string },
  index: number,
  total: number
): string {
  return [
    `\n${'─'.repeat(50)}`,
    `Нарушение ${index + 1} из ${total} [${violation.criticality.toUpperCase()}]`,
    `${'─'.repeat(50)}`,
    `Файл: ${violation.file}:${violation.line}`,
    `Правило: ${violation.text}`,
    `${'─'.repeat(50)}`,
    `Опубликовать комментарий?`,
  ].join('\n');
}
