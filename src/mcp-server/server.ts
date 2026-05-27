import dotenv from 'dotenv';
dotenv.config();

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { QdrantVectorStore } from '@langchain/qdrant';
import { z } from 'zod';

const COLLECTION_NAME = 'code-guidelines';

// ---------------------------------------------------------------------------
// Типы GitHub API
// ---------------------------------------------------------------------------

interface GitHubFile {
  filename: string;
  status: string;
  patch?: string;
}

interface GitHubPr {
  head: { ref: string; sha: string };
}

interface GitHubContent {
  content: string;
  encoding: string;
}

interface GitHubComment {
  html_url: string;
}

// ---------------------------------------------------------------------------
// Сервер
// ---------------------------------------------------------------------------

const server = new McpServer(
  {
    name: 'ai-code-reviewer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ---------------------------------------------------------------------------
// search_guidelines
// ---------------------------------------------------------------------------

server.tool(
  'search_guidelines',
  'Поиск правил код-ревью в базе знаний.',
  {
    query: z.string().describe('Поисковый запрос'),
    limit: z.number().optional().default(3).describe('Количество чанков'),
  },
  async ({ query, limit }) => {
    console.error(`🔍 search_guidelines: "${query}"`);

    try {
      const embeddings = new OllamaEmbeddings({
        model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text-v2-moe',
        baseUrl: process.env.OLLAMA_BASE_URL,
      });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName: COLLECTION_NAME,
      });

      const docs = await vectorStore.similaritySearch(query, limit);

      const results = docs.map((doc) => ({
        source: doc.metadata.source || 'неизвестно',
        content: doc.pageContent,
      }));

      console.error(`   Найдено: ${results.length} чанков`);

      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    } catch (e) {
      const error = e as Error;
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// get_pull_request_diff
// ---------------------------------------------------------------------------

server.tool(
  'get_pull_request_diff',
  'Получает дифф пул-реквеста из GitHub.',
  {
    prNumber: z.number().describe('Номер пул-реквеста'),
  },
  async ({ prNumber }) => {
    console.error(`📥 get_pull_request_diff: PR #${prNumber}`);

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'GITHUB_OWNER, GITHUB_REPO или GITHUB_TOKEN не заданы' }) }],
      };
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        const body = await response.text();
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `GitHub API: ${response.status} ${body}` }) }],
        };
      }

      const files = (await response.json()) as GitHubFile[];

      const result = files.map((f) => ({
        filename: f.filename,
        status: f.status,
        patch: f.patch || '(бинарный файл или нет изменений)',
      }));

      console.error(`   Получено файлов: ${result.length}`);

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (e) {
      const error = e as Error;
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// get_file_content
// ---------------------------------------------------------------------------

server.tool(
  'get_file_content',
  'Получает содержимое файла из пул-реквеста.',
  {
    prNumber: z.number().describe('Номер пул-реквеста'),
    filePath: z.string().describe('Путь к файлу в репозитории'),
  },
  async ({ prNumber, filePath }) => {
    console.error(`📄 get_file_content: PR #${prNumber}, ${filePath}`);

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Не заданы переменные окружения GitHub' }) }],
      };
    }

    try {
      const prResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!prResponse.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `PR #${prNumber} не найден` }) }],
        };
      }

      const prData = (await prResponse.json()) as GitHubPr;
      const branch = prData.head.ref;

      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!fileResponse.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Файл ${filePath} не найден в ветке ${branch}` }) }],
        };
      }

      const fileData = (await fileResponse.json()) as GitHubContent;
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

      console.error(`   Размер: ${content.length} символов`);

      return {
        content: [{ type: 'text', text: JSON.stringify({ path: filePath, content }) }],
      };
    } catch (e) {
      const error = e as Error;
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// post_review_comment
// ---------------------------------------------------------------------------

server.tool(
  'post_review_comment',
  'Публикует комментарий к строке в пул-реквесте на GitHub.',
  {
    prNumber: z.number().describe('Номер пул-реквеста'),
    file: z.string().describe('Путь к файлу'),
    line: z.number().describe('Номер строки'),
    text: z.string().describe('Текст комментария'),
  },
  async ({ prNumber, file, line, text }) => {
    console.error(`💬 post_review_comment: PR #${prNumber}, ${file}:${line}`);

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'Не заданы переменные окружения GitHub' }) }],
      };
    }

    const prResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const prData = (await prResponse.json()) as GitHubPr;
    const commitId = prData.head.sha;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: text,
            commit_id: commitId,
            path: file,
            line: line,
            side: 'RIGHT',
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Ошибка публикации: ${response.status} ${body}` }) }],
        };
      }

      const comment = (await response.json()) as GitHubComment;
      console.error(`   ✅ Опубликовано: ${comment.html_url}`);

      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, url: comment.html_url }) }],
      };
    } catch (e) {
      const error = e as Error;
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Запуск
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ MCP-сервер запущен');
}

main().catch((err) => {
  console.error('❌ Критическая ошибка:', err);
  process.exit(1);
});
