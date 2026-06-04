import { checkInput } from '../guards/input-guard.js';

export interface SecurityResult {
  passed: boolean;
  reason?: string;
}

/**
 * Агент-безопасник проверяет дифф на прямые инъекции.
 */
export async function securityCheck(files: Array<{ filename: string; patch?: string }>): Promise<SecurityResult> {
  console.log('🛡️ Агент-безопасник: проверка на инъекции...');

  for (const file of files) {
    if (file.patch) {
      const result = checkInput(file.patch);
      if (!result.passed) {
        console.log(`   ⛔ ${result.reason}`);
        return result;
      }
    }
  }

  console.log('   ✅ Инъекций не обнаружено');
  return { passed: true };
}
