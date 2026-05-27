import dotenv from 'dotenv';
dotenv.config();

interface OllamaTags {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

async function main() {
  console.log('🚀 AI Code Reviewer');
  console.log('==================\n');

  // Проверка Qdrant
  try {
    const qdrantUrl = `${process.env.QDRANT_URL}/healthz`;
    console.log(`Проверяю Qdrant: ${qdrantUrl}`);

    const response = await fetch(qdrantUrl);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    console.log(`✅ Qdrant: ${text}`);
  } catch (e) {
    const error = e as Error;
    console.error('❌ Qdrant недоступен:', error.message);
  }

  // Проверка Ollama
  try {
    const ollamaUrl = `${process.env.OLLAMA_BASE_URL}/api/tags`;
    console.log(`\nПроверяю Ollama: ${ollamaUrl}`);

    const response = await fetch(ollamaUrl);
    const data = (await response.json()) as OllamaTags;

    console.log('✅ Ollama: моделей загружено —', data.models?.length ?? 0);
  } catch (e) {
    const error = e as Error;
    console.error('❌ Ollama недоступен:', error.message);
  }

  console.log('\n✅ Проверка завершена.');
}

main();
