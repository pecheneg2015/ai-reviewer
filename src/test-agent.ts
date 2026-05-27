import dotenv from 'dotenv';
dotenv.config();

import { askAgent } from './agent.js';

const testQuestions = [
  'Как называть обработчики событий?',
  'Какие требования к тестам?',
  'Что запрещено в React?',
  'Как оформлять импорты?',
  'Какие правила для коммитов?',
];

async function main() {
  console.log('🧪 Тестирование RAG-агента');
  console.log('==========================\n');

  for (const question of testQuestions) {
    const answer = await askAgent(question);
    console.log(`\n📋 Ответ:\n${answer}`);
    console.log('\n' + '='.repeat(50));
  }

  console.log('\n✅ Тестирование завершено.');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
