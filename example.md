```
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
(node:2140) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
(Use `node --trace-warnings ...` to show where the warning was created)
   Получено файлов: 1
   Файлов: 1
🛡️ Агент-безопасник: проверка на инъекции...
   ✅ Инъекций не обнаружено
👔 Супервизор: анализ ситуации...
   Решение: analyze_diff
📥 Агент-анализатор: проход 1/2...

📥 Агент-анализатор: проход 1/2...

1️⃣ Получение диффа...
📥 get_pull_request_diff: PR #1
   Получено файлов: 1
   Файлов: 1
(node:10364) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
(Use `node --trace-warnings ...` to show where the warning was created)
🔑 GigaChat токен обновлён
   🧠 Контекст из истории: ### Паттерны нарушений:
- **Отсутствие атрибута `alt`** у `<img>` (высокий приоритет).
- **Использов...
2️⃣ Загрузка правил (MMR)...
   Загружено: 7 правил
2.5️⃣ Генерация чек-листа...
🔑 GigaChat токен обновлён
   Пунктов: 49
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
   - dangerouslySetInnerHTML usage requires sanitization
   - document.getElementById is forbidden; use refs instead
   - console.log statements are forbidden in production code
   - Computed values must not be stored in state
   - useEffect hooks must always specify a dependency array
   - Empty dependency array [] indicates mount-only effect
   - <img> tags must include an alt attribute
   - Decorative images require empty alt='' attribute
   - Informative images require descriptive alt text
   - Form inputs, selects, and textareas must have associated labels
   - htmlFor attribute must link label to corresponding input element
   - `<button>` elements must be used for actions while `<a>` is reserved for navigation
   - Buttons must contain either text content or an aria-label attribute
   - Interactive elements must support keyboard accessibility
   - Focus visibility must be ensured for interactive elements
   - Semicolons are mandatory at the end of every expression
   - Strings must use single quotes
   - JSX attributes must use double quotes
   - Imports must be sorted alphabetically
   - Third-party libraries come before internal module imports
   - Unused imports are strictly forbidden
   - Commented-out code must be removed prior to merging
   - Every component must have at least one unit test
   - New components must achieve minimum 80% test coverage
   - Unit tests must utilize Vitest or Jest frameworks
   - Test files must reside next to their respective components
   - Tests must clearly describe expected behavior through their names
   - Arrange-Act-Assert testing pattern must be followed
   - Each test case must contain exactly one assertion
   - Components must be tested using React Testing Library
   - Behavior rather than implementation details must be tested
   - External dependencies must be mocked during testing
📄 src/Test.tsx
🔑 GigaChat токен обновлён
   🧠 LLM-анализ...

👔 Супервизор: анализ ситуации...
   Решение: analyze_diff (проход 2/2)
📥 Агент-анализатор: проход 2/2...

📥 Агент-анализатор: проход 2/2...

1️⃣ Получение диффа...
📥 get_pull_request_diff: PR #1
   Получено файлов: 1
   Файлов: 1
🔑 GigaChat токен обновлён
   🧠 Контекст из истории: ### Паттерны нарушений:
- **Отсутствие атрибута `alt`** у `<img>` тегов (высокий приоритет).
- **Исп...
2️⃣ Загрузка правил (MMR)...
   Загружено: 7 правил
2.5️⃣ Генерация чек-листа...
🔑 GigaChat токен обновлён
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
   - Direct mutation of state is forbidden
   - useReducer hook must be used for complex state management
   - dangerouslySetInnerHTML usage without sanitization is forbidden
   - document.getElementById must not be used; use refs instead
   - console.log statements are forbidden in production code
   - Computed values must not be stored in state
   - useEffect hooks must always have a dependency array specified
   - Empty dependency array [] indicates mount-only effect
   - <img> tags must have an alt attribute present
   - Decorative images require empty alt='' attribute
   - Informative images require meaningful alt descriptions
   - Form inputs, selects, and textareas must have associated labels
   - htmlFor attribute must correctly link label to corresponding input element
   - `<button>` elements must be used for action triggers while `<a>` is reserved for navigation purposes
   - Buttons must contain either text content or an aria-label attribute
   - Interactive elements must support keyboard accessibility
   - Focus visibility must be ensured for interactive elements
   - Semicolons are mandatory at the end of every expression
   - String literals must use single quotes
   - JSX attributes must use double quotes
   - Imports must be sorted alphabetically
   - Third-party libraries come before internal module imports
   - Unused import statements are strictly prohibited
   - Commented-out code must be removed prior to merging changes
📄 src/Test.tsx
🔑 GigaChat токен обновлён
   🧠 LLM-анализ...

💬 post_review_comment: PR #1, src/Test.tsx:4
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3375496833
💬 post_review_comment: PR #1, src/Test.tsx:4
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3375496945
💬 post_review_comment: PR #1, src/Test.tsx:6
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3375497037

⏳ Требуется подтверждение для 3 нарушений:

──────────────────────────────────────────────────
Нарушение 1 из 3 [HIGH]
──────────────────────────────────────────────────
Файл: src/Test.tsx:10
Правило: Buttons must contain either text content or an aria-label attribute
──────────────────────────────────────────────────
Опубликовать комментарий?
 [y/n]: y
💬 post_review_comment: PR #1, src/Test.tsx:10
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3375497561
   ✅ Опубликовано

──────────────────────────────────────────────────
Нарушение 2 из 3 [HIGH]
──────────────────────────────────────────────────
Файл: src/Test.tsx:11
Правило: <img> tags must have an alt attribute present
──────────────────────────────────────────────────
Опубликовать комментарий?
 [y/n]: y
💬 post_review_comment: PR #1, src/Test.tsx:11
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3375497763
   ✅ Опубликовано

──────────────────────────────────────────────────
Нарушение 3 из 3 [HIGH]
──────────────────────────────────────────────────
Файл: src/Test.tsx:12
Правило: console.log statements are forbidden in production code
──────────────────────────────────────────────────
Опубликовать комментарий?
 [y/n]: y
💬 post_review_comment: PR #1, src/Test.tsx:12
   ✅ Опубликовано: https://github.com/pecheneg2015/ai_code_review_test_project/pull/1#discussion_r3375497958
   ✅ Опубликовано
   💾 Запись сохранена в историю (всего: 10)
👔 Супервизор: анализ ситуации...
🔑 GigaChat токен обновлён
   Решение: retrieve
🧠 Генерация ответа...
🔑 GigaChat токен обновлён

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Время: 60.2 сек.
✅ Полный анализ завершён.

📊 Найдено нарушений: 6
💬 Авто-комментариев: 3
⏳ Требуют подтверждения (HITL): 3
✅ Подтверждено: 3
❌ Пропущено: 0

   ✅ [src/Test.tsx:4] Event handlers must start with 'handle' [medium]
   ✅ [src/Test.tsx:4] Forbidden abbreviations in event handler names: btnClck, hndlSbmt, onClk [medium]
   ✅ [src/Test.tsx:6] React components must follow PascalCase naming convention [medium]
   ✅ [src/Test.tsx:10] Buttons must contain either text content or an aria-label attribute [high]
   ✅ [src/Test.tsx:11] <img> tags must have an alt attribute present [high]
   ✅ [src/Test.tsx:12] console.log statements are forbidden in production code [high]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Проверка завершена.

```
