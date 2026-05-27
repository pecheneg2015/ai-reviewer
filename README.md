# 🤖 AI Code Reviewer

Автоматический ревьюер пул-реквестов с RAG, MCP и Human-in-the-Loop.

## Архитектура

```
[CLI] → [LangGraph Agent]
           ├── retrieve (Qdrant)
           └── generate (Ollama / OpenAI)
```

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

### 5. Запустить все тесты

```bash
npm run test-agent
```

## Команды

| Команда | Описание |
|---------|----------|
| `npm run health` | Проверка Qdrant и Ollama |
| `npm run ingest` | Индексация документов в Qdrant |
| `npm run ask "вопрос"` | Задать вопрос агенту |
| `npm run test-agent` | Прогнать 5 тестовых вопросов |
| `npm run review <PR>` | Проверка PR (Спринт 2) |

## Документы в RAG

- `code-style.md` — правила оформления кода
- `naming-conventions.md` — правила именования
- `react-patterns.md` — паттерны и антипаттерны React
- `testing-requirements.md` — требования к тестам
- `accessibility.md` — требования по доступности
- `security-guidelines.md` — правила безопасности
- `git-workflow.md` — правила Git и PR

## Технологии

- **LangChain** + **LangGraph** — оркестрация агента
- **Qdrant** — векторная база данных
- **Ollama** — локальные модели (эмбеддинги + LLM)
- **MCP** — Model Context Protocol (Спринт 2)
- **TypeScript** — язык разработки

## Статус

- [x] Спринт 1: RAG-агент
- [ ] Спринт 2: MCP-сервер + GitHub
- [ ] Спринт 3: Защита + HITL
- [ ] Спринт 4: Финал
