/**
 * Выполняет функцию с повторными попытками при ошибке.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, onRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const error = e as Error;

      if (attempt === maxRetries) {
        throw error;
      }

      if (onRetry) {
        onRetry(attempt, error);
      }

      const delay = delayMs * Math.pow(2, attempt - 1); // Экспоненциальная задержка
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Недостижимо');
}

/**
 * Безопасный вызов LLM с fallback-ответом.
 */
export async function safeLLMCall<T>(
  fn: () => Promise<T>,
  fallback: T,
  label = 'LLM'
): Promise<T> {
  try {
    return await withRetry(fn, {
      maxRetries: 3,
      onRetry: (attempt, error) => {
        console.log(`   ⚠️ ${label}: попытка ${attempt} не удалась (${error.message})`);
      },
    });
  } catch (e) {
    const error = e as Error;
    console.log(`   ❌ ${label}: все попытки исчерпаны (${error.message})`);
    return fallback;
  }
}
