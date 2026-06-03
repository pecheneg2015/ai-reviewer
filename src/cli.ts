import dotenv from 'dotenv';
dotenv.config();

import { graph } from './graph.js';
import { closeMCPClient } from './mcp-tools.js';
import { loadHistory, formatHistory, saveRecord, formatLastRecord } from './utils/memory.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // -----------------------------------------------------------------------
  // review
  // -----------------------------------------------------------------------
  if (command === 'review') {
    const prNumber = parseInt(args[1], 10);

    if (!prNumber) {
      console.log('❌ Использование: npm run review <номер_PR>');
      process.exit(1);
    }

    console.log('');
    console.log('🤖 AI Code Reviewer');
    console.log('━'.repeat(50));
    console.log(`📋 Проверка PR #${prNumber}`);
    console.log('━'.repeat(50));
    console.log('');

    const startTime = Date.now();

    try {
      const result = await graph.invoke({
        question: '',
        context: '',
        answer: '',
        mode: 'review',
        prNumber,
        reviewResult: '',
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log('\n' + '━'.repeat(50));
      console.log(`⏱️  Время: ${elapsed} сек.`);
      console.log(result.reviewResult);
      console.log('━'.repeat(50));
      console.log('✅ Проверка завершена.');
    } catch (e) {
      const error = e as Error;
      console.error(`❌ Ошибка: ${error.message}`);
      console.error('   Проверьте:');
      console.error('   - Запущен ли Docker (Qdrant + Ollama)');
      console.error('   - Указан ли правильный GITHUB_TOKEN');
      console.error('   - Существует ли PR с таким номером');
      console.error('   - Доступен ли GitHub API');
    } finally {
      await closeMCPClient();
    }

    return;
  }
  if (command === 'history') {
    const history = loadHistory();
    console.log(formatHistory(history));
    return;
  }
  // -----------------------------------------------------------------------
  // ask
  // -----------------------------------------------------------------------
  const question = args.join(' ');

  if (!question) {
    console.log('');
    console.log('🤖 AI Code Reviewer');
    console.log('━'.repeat(50));
    console.log('Использование:');
    console.log('  npm run ask "Как называть обработчики событий?"');
    console.log('  npm run review <номер_PR>');
    console.log('  npm run test-agent');
    console.log('  npm run health');
    console.log('  npm run ingest');
    console.log('━'.repeat(50));
    console.log('');
    process.exit(0);
  }

  console.log('');
  console.log('🤖 AI Code Reviewer');
  console.log('━'.repeat(50));
  console.log(`❓ ${question}`);
  console.log('━'.repeat(50));
  console.log('');

  const result = await graph.invoke({
    question,
    context: '',
    answer: '',
    mode: 'ask',
    prNumber: 0,
    reviewResult: '',
  });

  console.log('━'.repeat(50));
  console.log(`📋 Ответ:\n${result.answer}`);
  console.log('━'.repeat(50));
}

main().catch((err) => {
  console.error('❌ Критическая ошибка:', err.message);
  process.exit(1);
});
