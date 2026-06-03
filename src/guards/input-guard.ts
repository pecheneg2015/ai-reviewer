const INJECTION_PATTERNS = [
  /игнорируй/i,
  /забудь всё/i,
  /ignore all/i,
  /новые инструкции/i,
  /new prompt/i,
  /системная инструкция/i,
  /system prompt/i,
  /ты теперь/i,
  /you are now/i,
  /одобри без провер/i,
  /approve without review/i,
  /раскрой свои правила/i,
  /reveal your rules/i,
];

export interface GuardResult {
  passed: boolean;
  reason?: string;
}

/**
 * Проверяет входной запрос на признаки prompt injection.
 */
export function checkInput(input: string): GuardResult {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        passed: false,
        reason: `Обнаружена попытка инъекции: "${input.match(pattern)?.[0]}"`,
      };
    }
  }

  return { passed: true };
}
