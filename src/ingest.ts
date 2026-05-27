import dotenv from 'dotenv';
dotenv.config();

import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { QdrantVectorStore } from '@langchain/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';
import { Document } from '@langchain/core/documents';

const DOCUMENTS_DIR = join(process.cwd(), 'documents');
const COLLECTION_NAME = 'code-guidelines';
const CHUNK_SIZE = 500;        // Было 1000
const CHUNK_OVERLAP = 100;     // Было 200
const USE_LOCAL_MODELS = process.env.USE_LOCAL_MODELS === 'true';

function loadDocuments(dir: string): Document[] {
  const files = readdirSync(dir).filter((f) => extname(f) === '.md');
  console.log(`📄 Найдено файлов: ${files.length}`);

  const docs: Document[] = [];

  for (const file of files) {
    const path = join(dir, file);
    const content = readFileSync(path, 'utf-8');
    docs.push(
      new Document({
        pageContent: content,
        metadata: {
          source: file,
          title: file.replace('.md', ''),
        },
      })
    );
    console.log(`  ✅ ${file} (${content.length} символов)`);
  }

  return docs;
}

async function main() {
  console.log('🔧 Индексация документов в Qdrant');
  console.log('=================================\n');

  // 0. Очистка
  console.log('0️⃣ Очистка существующей коллекции...');
  const client = new QdrantClient({ url: process.env.QDRANT_URL });

  try {
    await client.deleteCollection(COLLECTION_NAME);
    console.log(`   Коллекция ${COLLECTION_NAME} удалена`);
  } catch {
    console.log(`   Коллекция ${COLLECTION_NAME} не существовала`);
  }

  // 1. Загрузка
  console.log('\n1️⃣ Загрузка документов...');
  const documents = loadDocuments(DOCUMENTS_DIR);

  // 2. Разбивка — более мелкие чанки, разделители по строкам
  console.log('\n2️⃣ Разбивка на чанки...');
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ['\n\n', '\n', ' ', ''],   // Сначала двойной перенос, потом одинарный
  });

  const chunks = await splitter.splitDocuments(documents);
  console.log(`   Получено чанков: ${chunks.length}`);

  // Показать первые 3 чанка для проверки
  console.log('\n   📝 Примеры чанков:');
  for (const [i, chunk] of chunks.slice(0, 3).entries()) {
    const source = chunk.metadata.source || 'неизвестно';
    const preview = chunk.pageContent.replace(/\n/g, '\\n');
    console.log(`   ${i + 1}. [${source}] ${preview.slice(0, 150)}...`);
  }

  // 3. Эмбеддинги
  console.log('\n3️⃣ Инициализация модели эмбеддингов...');
  const embeddings = USE_LOCAL_MODELS
    ? new OllamaEmbeddings({
      model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text-v2-moe',
      baseUrl: process.env.OLLAMA_BASE_URL,
    })
    : new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
    });

  console.log(
    `   Модель: ${USE_LOCAL_MODELS ? `Ollama (${process.env.OLLAMA_EMBED_MODEL})` : 'OpenAI (text-embedding-3-small)'}`
  );

  // 4. Индексация
  console.log('\n4️⃣ Индексация в Qdrant...');

  const vectorStore = await QdrantVectorStore.fromDocuments(chunks, embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: COLLECTION_NAME,
  });

  console.log(`   Коллекция: ${COLLECTION_NAME}`);
  console.log(`   Загружено чанков: ${chunks.length}`);

  // 5. Валидация — показываем полный текст без обрезания
  console.log('\n5️⃣ Валидация: тестовый поиск...');

  const testQueries = [
    'Как называть обработчики событий?',
    'Какие требования к тестам?',
    'Что запрещено в React?',
  ];

  for (const query of testQueries) {
    const results = await vectorStore.similaritySearch(query, 2);
    console.log(`\n   🔍 "${query}"`);
    for (const [i, doc] of results.entries()) {
      const source = doc.metadata.source || 'неизвестно';
      console.log(`      ${i + 1}. [${source}]`);
      console.log(`      ${doc.pageContent}`);
      console.log('');
    }
  }

  console.log('✅ Индексация завершена успешно.');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
