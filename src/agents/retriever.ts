import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { QdrantVectorStore } from '@langchain/qdrant';
import { sanitizeContext } from '../guards/context-sanitizer.js';

const COLLECTION_NAME = 'code-guidelines';

export async function retrieveContext(question: string): Promise<string> {
  console.log('🔍 Поиск релевантных документов (MMR)...');

  const embeddings = new OllamaEmbeddings({
    model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text-v2-moe',
    baseUrl: process.env.OLLAMA_BASE_URL,
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: COLLECTION_NAME,
  });

  const docs = await vectorStore.maxMarginalRelevanceSearch(question, {
    k: 3,
    fetchK: 10,
    lambda: 0.5,
  });

  console.log(`   Найдено чанков: ${docs.length}`);

  return sanitizeContext(
    docs.map((doc) => ({
      source: (doc.metadata.source as string) || 'неизвестно',
      content: doc.pageContent,
    }))
  );
}
