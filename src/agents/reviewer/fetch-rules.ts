import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { QdrantVectorStore } from '@langchain/qdrant';
import { sanitizeContext } from '../../guards/context-sanitizer.js';
import { getMCPTools } from '../../mcp-tools.js';
import type { Rule } from './types.js';

const COLLECTION_NAME = 'code-guidelines';

const RULES_QUERIES = [
  'naming conventions for React event handlers functions variables camelCase PascalCase',
  'forbidden patterns in React code console.log dangerouslySetInnerHTML document.getElementById',
  'React component code style rules imports formatting',
  'img alt attribute accessibility JSX',
  'props destructuring TypeScript',
];
export async function fetchRules(): Promise<string> {
  console.log('2️⃣ Загрузка правил (MMR)...');

  const embeddings = new OllamaEmbeddings({
    model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text-v2-moe',
    baseUrl: process.env.OLLAMA_BASE_URL,
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: COLLECTION_NAME,
  });

  const allRules: Rule[] = [];
  const seenSources = new Set<string>();

  for (const query of RULES_QUERIES) {
    try {
      const docs = await vectorStore.maxMarginalRelevanceSearch(query, {
        k: 3,
        fetchK: 10,
        lambda: 0.5,
      });

      for (const doc of docs) {
        const source = (doc.metadata.source as string) || 'неизвестно';
        if (!seenSources.has(source)) {
          seenSources.add(source);
          allRules.push({ source, content: doc.pageContent });
        }
      }
    } catch {
      // Fallback: обычный поиск через MCP
      try {
        const tools = await getMCPTools();
        const searchTool = tools.find((t: any) => t.name === 'search_guidelines');
        if (searchTool) {
          const raw = await searchTool.invoke(JSON.stringify({ query, limit: 3 }));
          const results = JSON.parse(raw);
          for (const r of results) {
            if (!seenSources.has(r.source)) {
              seenSources.add(r.source);
              allRules.push(r);
            }
          }
        }
      } catch {
        // пропускаем
      }
    }
  }

  console.log(`   Загружено: ${allRules.length} правил`);

  return sanitizeContext(
    allRules.map((r) => ({ source: r.source, content: r.content }))
  );
}
