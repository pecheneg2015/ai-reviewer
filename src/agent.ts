import { graph } from './graph.js';

export async function askAgent(question: string): Promise<string> {
  console.log(`\n🤖 Вопрос: "${question}"`);
  console.log('━'.repeat(50));

  const result = await graph.invoke({ question, context: '', answer: '' });

  console.log('✅ Ответ получен');
  console.log('━'.repeat(50));

  return result.answer;
}
