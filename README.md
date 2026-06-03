# 🤖 AI Code Reviewer

Автоматический ревьюер пул-реквестов с RAG, MCP, мультиагентностью и Human-in-the-Loop.

## Архитектура

```
[CLI] → [LangGraph]
           ├── Supervisor Agent (выбор маршрута)
           ├── Retriever Agent (MMR-поиск в Qdrant)
           ├── Reviewer Agent (анализ диффа через MCP)
           └── Generator Agent (ответ через Ollama)
```

## Возможности

### RAG-пайплайн
- 7 документов с правилами код-ревью (naming, React, тесты, a11y, безопасность, git)
- MMR-поиск для разнообразия результатов
- ContextSanitizer — защита от косвенных инъекций через XML-обёртку

### MCP-интеграция
- Кастомный MCP-сервер с 4 инструментами:
  - `search_guidelines` — поиск правил в Qdrant
  - `get_pull_request_diff` — получение диффа из GitHub
  - `get_file_content` — чтение файла из PR
  - `post_review_comment` — публикация комментария

### Защита от prompt injection
- **Pre-Guard** — фильтрация прямых инъекций в диффе
- **ContextSanitizer** — фильтрация косвенных инъекций в RAG
- **CriticalityClassifier** — 4 уровня критичности нарушений

### Human-in-the-Loop
- Критические нарушения (critical/high) требуют подтверждения `[y/n]`
- Обычные нарушения (medium/low) постятся автоматически

### Отказоустойчивость
- Retry с экспоненциальной задержкой для LLM-вызовов
- Fallback на мок-данные при недоступности GitHub API
- Безопасные вызовы LLM с дефолтными ответами

### Память агента
- Сохранение истории проверок в JSON
- Просмотр через `npm run history`

## Быстрый старт

### 1. Установка

```bash
git clone <repo>
cd ai-code-reviewer
npm install
cp .env.example .env
# Заполнить .env своими ключами
```

### 2. Запуск окружения

```bash
docker compose up -d
```

### 3. Индексация документов

```bash
npm run ingest
```

### 4. Задать вопрос агенту

```bash
npm run ask "Как называть обработчики событий?"
```

### 5. Проверить пул-реквест

```bash
npm run review 1
```

### 6. История проверок

```bash
npm run history
```

## Команды

| Команда | Описание |
|---------|----------|
| `npm run health` | Проверка Qdrant и Ollama |
| `npm run ingest` | Индексация документов в Qdrant |
| `npm run ask "вопрос"` | Задать вопрос агенту |
| `npm run test-agent` | Прогнать 5 тестовых вопросов |
| `npm run review <PR>` | Проверить пул-реквест |
| `npm run history` | Просмотр истории проверок |
| `npm run mcp-test` | Тест MCP-клиента |

## Документы в RAG

| Файл | Содержание |
|------|-----------|
| `code-style.md` | Правила оформления кода |
| `naming-conventions.md` | Правила именования |
| `react-patterns.md` | Паттерны и антипаттерны React |
| `testing-requirements.md` | Требования к тестам |
| `accessibility.md` | Требования по доступности |
| `security-guidelines.md` | Правила безопасности |
| `git-workflow.md` | Правила Git и PR |

## Технологии

| Технология | Назначение |
|-----------|-----------|
| **LangChain + LangGraph** | Оркестрация агентов |
| **Qdrant** | Векторная база данных |
| **Ollama** | Локальные модели (qwen2.5-coder:7b, nomic-embed-text-v2-moe) |
| **MCP** | Model Context Protocol |
| **GitHub API** | Интеграция с пул-реквестами |
| **TypeScript** | Язык разработки |

## Статус проекта

| Спринт | Содержание | Статус |
|:---:|---|:---:|
| 1 | Docker, Qdrant, RAG-агент | ✅ |
| 2 | MCP-сервер, GitHub-интеграция | ✅ |
| 3 | Pre-Guard, ContextSanitizer, HITL | ✅ |
| 4 | MMR-поиск, retry, fallback, память | ✅ |
| 5 | Мультиагентность | ⏳ |
| 6 | Финал: CLI, сценарий, документация | ⬜ |
