import dotenv from 'dotenv';
dotenv.config();

import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PromptTemplate } from '@langchain/core/prompts';
import { getMCPTools } from './mcp-tools.js';

const COLLECTION_NAME = 'code-guidelines';

// ---------------------------------------------------------------------------
// Состояние
// ---------------------------------------------------------------------------

const AgentState = Annotation.Root({
  question: Annotation<string>({ reducer: (_, next) => next ?? '' }),
  context: Annotation<string>({ reducer: (_, next) => next ?? '' }),
  answer: Annotation<string>({ reducer: (_, next) => next ?? '' }),
  mode: Annotation<'ask' | 'review'>({ reducer: (_, next) => next ?? 'ask' }),
  prNumber: Annotation<number>({ reducer: (_, next) => next ?? 0 }),
  reviewResult: Annotation<string>({ reducer: (_, next) => next ?? '' }),
});

type AgentStateType = typeof AgentState.State;

// ---------------------------------------------------------------------------
// retrieve
// ---------------------------------------------------------------------------

async function retrieveNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  console.log('🔍 Поиск релевантных документов...');

  const embeddings = new OllamaEmbeddings({
    model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text-v2-moe',
    baseUrl: process.env.OLLAMA_BASE_URL,
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: COLLECTION_NAME,
  });

  const docs = await vectorStore.similaritySearch(state.question, 3);
  console.log(`   Найдено чанков: ${docs.length}`);

  const context = docs.map((doc) => doc.pageContent).join('\n\n');
  return { context };
}

// ---------------------------------------------------------------------------
// analyze_diff
// ---------------------------------------------------------------------------

async function analyzeDiffNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  console.log('📥 Анализ PR...\n');

  let tools;
  try {
    tools = await getMCPTools();
  } catch (e) {
    return { reviewResult: '❌ Не удалось подключиться к MCP-серверу.' };
  }

  const diffTool = tools.find((t) => t.name === 'get_pull_request_diff');
  const searchTool = tools.find((t) => t.name === 'search_guidelines');
  const commentTool = tools.find((t) => t.name === 'post_review_comment');

  if (!diffTool || !searchTool || !commentTool) {
    return { reviewResult: '❌ Не все MCP-инструменты доступны.' };
  }

  // 1. Получаем дифф
  console.log('1️⃣ Получение диффа...');
  let diffRaw: string;
  try {
    diffRaw = await diffTool.invoke(JSON.stringify({ prNumber: state.prNumber }));
  } catch {
    return { reviewResult: '❌ Не удалось получить дифф.' };
  }

  let files: Array<{ filename: string; status: string; patch: string }>;
  try {
    const parsed = JSON.parse(diffRaw);
    if ((parsed as any).error) {
      return { reviewResult: `❌ GitHub API: ${(parsed as any).error}` };
    }
    files = parsed;
  } catch {
    return { reviewResult: '❌ Ошибка парсинга диффа.' };
  }

  if (files.length === 0) {
    return { reviewResult: 'ℹ️ PR не содержит изменений.' };
  }

  console.log(`   Файлов: ${files.length}\n`);

  // 2. Загружаем правила
  console.log('2️⃣ Загрузка правил...');
  const rulesQueries = [
    'naming conventions for React event handlers functions variables camelCase PascalCase',
    'forbidden patterns in React code console.log dangerouslySetInnerHTML document.getElementById',
    'React component code style rules imports formatting',
  ];

  const allRules: Array<{ source: string; content: string }> = [];
  const seenSources = new Set<string>();

  for (const query of rulesQueries) {
    const raw = await searchTool.invoke(
      JSON.stringify({ query, limit: 3 })
    );

    try {
      const results = JSON.parse(raw);
      for (const r of results) {
        if (!seenSources.has(r.source)) {
          seenSources.add(r.source);
          allRules.push(r);
        }
      }
    } catch {
      // пропускаем
    }
  }

  if (allRules.length === 0) {
    return { reviewResult: '❌ Не удалось загрузить правила.' };
  }

  console.log(`   Загружено: ${allRules.length} правил\n`);

  const rulesText = allRules.map((r) => `### ${r.source}\n${r.content}`).join('\n\n');

  // 2.5 Генерируем чек-лист
  const CHECKLIST_PROMPT = PromptTemplate.fromTemplate(`Извлеки из стандартов команды конкретные пункты для код-ревью.
  Проект использует React с функциональными компонентами и TypeScript.
  Проверяемые файлы: .tsx (React-компоненты) и .ts (утилиты, хуки, хелперы).

  Оставь только правила, которые можно проверить по диффу пул-реквеста.
  Не включай правила по безопасности, токенам, localStorage, CI/CD, правам доступа, заголовкам.

  ## Стандарты команды
  {rulesText}

  Верни JSON-массив строк:
  ["правило 1", "правило 2", ...]`);

  const checklistLLM = new ChatOllama({
    model: process.env.OLLAMA_LLM_MODEL || 'qwen2.5-coder:7b',
    baseUrl: process.env.OLLAMA_BASE_URL,
    temperature: 0,
  });

  console.log('2.5️⃣ Генерация чек-листа...');
  const checklistResponse = await checklistLLM.invoke(
    await CHECKLIST_PROMPT.format({ rulesText })
  );
  const checklistText = typeof checklistResponse.content === 'string' ? checklistResponse.content : '';

  let checklist: string[] = [];
  const checklistJson = checklistText.match(/\[[\s\S]*\]/);
  if (checklistJson) {
    try {
      checklist = JSON.parse(checklistJson[0]);
      console.log(`   Пунктов: ${checklist.length}`);
      for (const item of checklist) {
        console.log(`   - ${item}`);
      }
    } catch {
      console.log('   ⚠️ Не удалось разобрать чек-лист');
    }
  }
  console.log('');

  // 3. LLM-анализ
  const llm = new ChatOllama({
    model: process.env.OLLAMA_LLM_MODEL || 'qwen2.5-coder:7b',
    baseUrl: process.env.OLLAMA_BASE_URL,
    temperature: 0,
  });

  const REVIEW_PROMPT = PromptTemplate.fromTemplate(`Ты проводишь код-ревью пул-реквеста.

  ## Контекст проекта
  - React-приложение на TypeScript.
  - Компоненты — функциональные, с хуками (useState, useEffect, useCallback).
  - Стилизация через CSS-модули.
  - Тесты на Vitest + React Testing Library.
  - Сборка — Vite.

  ## Как читать дифф
  - Строки с + в начале — новый код, добавленный в этом PR.
  - Строки с - — старый код, он удалён.
  - Строка @@ -a,b +c,d @@ означает, что новый код начинается со строки c.
  - Проверяй только строки с + (кроме строки +++, это заголовок файла).
  - Одна и та же строка может нарушать несколько пунктов чек-листа — укажи все.

  ## Чек-лист
  {checklist}

  ## Дифф файла {filename}
  {diff}

  Верни только JSON, без пояснений:
  {{
    "violations": [
      {{ "line": <номер строки в новом файле>, "rule": "<формулировка из чек-листа>" }}
    ]
  }}

  Если нарушений нет, верни:
  {{
    "violations": []
  }}`);

  const allViolations: Array<{ file: string; line: number; text: string }> = [];
  let totalComments = 0;

  for (const file of files) {
    console.log(`📄 ${file.filename}`);

    if (!file.patch || file.patch === '(бинарный файл или нет изменений)') {
      console.log('   Пропущен\n');
      continue;
    }

    const formattedPrompt = await REVIEW_PROMPT.format({
      checklist: checklist.map((c, i) => `${i + 1}. ${c}`).join('\n'),
      filename: file.filename,
      diff: file.patch,
    });

    console.log('   🧠 LLM-анализ...');
    const startTime = Date.now();
    const response = await llm.invoke(formattedPrompt);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️ LLM: ${elapsed} сек.`);

    const text = typeof response.content === 'string' ? response.content : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`   ⚠️ Не удалось извлечь JSON\n`);
      continue;
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      const fileViolations = result.violations || [];

      if (fileViolations.length === 0) {
        console.log('   ✅ Нарушений нет\n');
        continue;
      }

      for (const v of fileViolations) {
        console.log(`   ⚠️ Строка ${v.line}: ${v.rule}`);

        try {
          await commentTool.invoke(
            JSON.stringify({
              prNumber: state.prNumber,
              file: file.filename,
              line: v.line,
              text: `🤖 **AI Code Review:** ${v.rule}.`,
            })
          );
          totalComments++;
          allViolations.push({ file: file.filename, line: v.line, text: v.rule });
        } catch {
          console.log(`   ⚠️ Не удалось опубликовать`);
        }
      }
    } catch {
      console.log(`   ⚠️ Ошибка парсинга JSON\n`);
    }

    console.log('');
  }

  // 4. Итог
  if (allViolations.length === 0) {
    return { reviewResult: '✅ Нарушений не найдено.' };
  }

  return {
    reviewResult:
      `📊 Найдено нарушений: ${allViolations.length}\n` +
      `💬 Опубликовано комментариев: ${totalComments}\n\n` +
      allViolations.map((v) => `   ⚠️ [${v.file}:${v.line}] ${v.text}`).join('\n'),
  };
}

// ---------------------------------------------------------------------------
// generate
// ---------------------------------------------------------------------------

const SYSTEM_TEMPLATE = `Ты — AI-ревьюер, который проверяет код на соответствие внутренним стандартам команды.
Отвечай **строго на основе предоставленных документов**.
Если в документах нет ответа, скажи: "В документах нет информации по этому вопросу".
Не придумывай правила, которых нет в документах.

Документы:
<document_context>
{context}
</document_context>

Вопрос: {question}

Ответ:`;

const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

async function generateNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  console.log('🧠 Генерация ответа...');

  const llm = new ChatOllama({
    model: process.env.OLLAMA_LLM_MODEL || 'qwen2.5-coder:7b',
    baseUrl: process.env.OLLAMA_BASE_URL,
    temperature: 0,
  });

  const formattedPrompt = await prompt.format({
    context: state.context,
    question: state.question,
  });

  const response = await llm.invoke(formattedPrompt);
  const answer = typeof response.content === 'string' ? response.content : '';

  return { answer };
}

// ---------------------------------------------------------------------------
// router
// ---------------------------------------------------------------------------

function routeByMode(state: AgentStateType): 'retrieve' | 'analyze_diff' {
  return state.mode === 'review' ? 'analyze_diff' : 'retrieve';
}

// ---------------------------------------------------------------------------
// Граф
// ---------------------------------------------------------------------------

const workflow = new StateGraph(AgentState)
  .addNode('retrieve', retrieveNode)
  .addNode('generate', generateNode)
  .addNode('analyze_diff', analyzeDiffNode)
  .addConditionalEdges(START, routeByMode, {
    retrieve: 'retrieve',
    analyze_diff: 'analyze_diff',
  })
  .addEdge('retrieve', 'generate')
  .addEdge('generate', END)
  .addEdge('analyze_diff', END);

export const graph = workflow.compile();
