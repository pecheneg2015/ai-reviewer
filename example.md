❯ npm run review 1

> ai-code-reviewer@0.0.0 review
> tsx src/cli.ts review 1


🤖 AI Code Reviewer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Проверка PR #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👔 Супервизор: анализ ситуации...
   Решение: security
1️⃣ Получение диффа...
✅ MCP-сервер запущен
🔌 MCP-клиент подключён
📥 get_pull_request_diff: PR #1
   Получено файлов: 1
   Файлов: 1
🛡️ Агент-безопасник: проверка на инъекции...
   ✅ Инъекций не обнаружено
👔 Супервизор: анализ ситуации...
   Решение: analyze_diff
📥 Агент-анализатор: анализ PR...
1️⃣ Получение диффа...
📥 get_pull_request_diff: PR #1
   Получено файлов: 1
   Файлов: 1
2️⃣ Загрузка правил (MMR)...
   Загружено: 7 правил
2.5️⃣ Генерация чек-листа...
   Пунктов: 39
   - Event handlers must start with 'handle'
   - Forbidden abbreviations in event handler names: btnClck, hndlSbmt, onClk
   - Variables and functions must follow camelCase convention
   - Variable and function names must be meaningful and at least 3 characters long
   - Single-letter variable names are forbidden except i, j, k in loops
   - React components must follow PascalCase naming convention
   - File name must exactly match component name
   - One component per folder with an index file required
   - Boolean variables must start with 'is', 'has' or 'should'
   - Global constants must use UPPER_SNAKE_CASE
   - Local constants must follow camelCase
   - Props must be destructured in component signature
   - TypeScript types must be used for props
   - Unused props are forbidden
   - useState hook must be used for managing local state
   - Direct mutation of state is prohibited
   - useReducer hook must be used for complex state management
   - dangerouslySetInnerHTML usage without sanitization is forbidden
   - document.getElementById must not be used; use refs instead
   - console.log statements are forbidden in production code
   - Computed values must not be stored in state
   - useEffect hooks must always have a dependency array specified
   - Empty dependency array [] indicates mount-only effect
   - <img> tags must have an alt attribute present
   - Decorative images require empty alt='' attribute
   - Informative images must have a meaningful alt description
   - Form inputs, selects, and textareas must have associated labels
   - htmlFor attribute must correctly link label to input element
   - Actionable elements must use <button>; navigational links must use <a>
   - Buttons must contain either text content or an aria-label attribute
   - Interactive elements must support keyboard accessibility
   - Focus visibility must be ensured for interactive elements
   - Semicolons are mandatory at the end of every expression
   - Strings must use single quotes
   - JSX attributes must use double quotes
   - Imports must be sorted alphabetically
   - Third-party libraries come before internal module imports
   - Unused import statements are strictly forbidden
   - Commented-out code must be removed prior to merging changes
📄 src/Test.tsx
   🧠 LLM-анализ...

💬 post_review_comment: PR #1, src/Test.tsx:4
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3358250359
💬 post_review_comment: PR #1, src/Test.tsx:4
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3358250501

⏳ Требуется подтверждение для 2 нарушений:

──────────────────────────────────────────────────
Нарушение 1 из 2 [HIGH]
──────────────────────────────────────────────────
Файл: src/Test.tsx:5
Правило: console.log statements are forbidden in production code
──────────────────────────────────────────────────
Опубликовать комментарий?
 [y/n]: y
💬 post_review_comment: PR #1, src/Test.tsx:5
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3358251075
   ✅ Опубликовано

──────────────────────────────────────────────────
Нарушение 2 из 2 [HIGH]
──────────────────────────────────────────────────
Файл: src/Test.tsx:12
Правило: img tags must have an alt attribute present
──────────────────────────────────────────────────
Опубликовать комментарий?
 [y/n]: y
💬 post_review_comment: PR #1, src/Test.tsx:12
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3358251322
   ✅ Опубликовано
   💾 Запись сохранена в историю (всего: 8)
👔 Супервизор: анализ ситуации...
   Решение: retrieve
🧠 Генерация ответа...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Время: 37.0 сек.
📊 Найдено нарушений: 4
💬 Авто-комментариев: 2
⏳ Требуют подтверждения (HITL): 2
✅ Подтверждено: 2
❌ Пропущено: 0

   ✅ [src/Test.tsx:4] Forbidden abbreviations in event handler names: btnClck, hndlSbmt, onClk [medium]
   ✅ [src/Test.tsx:4] Event handlers must start with 'handle' [medium]
   ✅ [src/Test.tsx:5] console.log statements are forbidden in production code [high]
   ✅ [src/Test.tsx:12] img tags must have an alt attribute present [high]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Проверка завершена.
