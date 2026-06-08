# 🤖 AI Code Reviewer

Мультиагентная система автоматического код-ревью с RAG, MCP и Human-in-the-Loop.

## Стек

| Технология | Назначение |
|-----------|-----------|
| **TypeScript** | Единый язык на всём проекте |
| **LangChain + LangGraph** | Оркестрация агентов, граф состояний |
| **Qdrant** | Векторная база данных (RAG) |
| **Ollama** | Локальные модели: qwen2.5-coder:7b (LLM), nomic-embed-text-v2-moe (эмбеддинги) |
| **GigaChat** | Облачный LLM через OpenAI-совместимый API |
| **MCP** (Model Context Protocol) | Стандартизированный доступ к инструментам GitHub |
| **Docker** | Окружение (Qdrant + Ollama) |

## Возможности

- 🔍 **RAG-пайплайн** — MMR-поиск по документам команды (7 файлов), генерация чек-листа, LLM-анализ диффа
- 🧠 **Мультиагентность** — 5 агентов (Supervisor, Security, Reviewer, Retriever, Generator) с агентским циклом
- 🔗 **MCP-интеграция** — 4 инструмента для работы с GitHub API
- 🛡️ **Защита от инъекций** — 3 эшелона (Pre-Guard, ContextSanitizer, CriticalityClassifier)
- 👤 **Human-in-the-Loop** — подтверждение критических нарушений через `[y/n]`
- 🔄 **Отказоустойчивость** — retry, fallback, смена провайдера
- 💾 **Память агента** — история проверок

## Быстрый старт

```bash
npm install
cp .env.example .env
docker compose up -d
npm run ingest
npm run ask "How to name event handlers?"
npm run review 1
npm run history
```

## Команды

| Команда | Описание |
|---------|----------|
| `npm run health` | Проверка Qdrant и Ollama |
| `npm run ingest` | Индексация документов |
| `npm run ask "вопрос"` | Задать вопрос по документам |
| `npm run review <PR>` | Проверить пул-реквест |
| `npm run history` | История проверок |
