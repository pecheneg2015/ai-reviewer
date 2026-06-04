# React Patterns

## Props
- Destructure props in component signature.
- Type props with TypeScript.
- Do not pass unused props.

## State
- Use useState for local state.
- Never mutate state directly.
- Use useReducer for complex state.

## Forbidden Patterns
- dangerouslySetInnerHTML without sanitization.
- document.getElementById — use refs instead.
- console.log in production code.
- Computed values stored in state.

## Effects
- useEffect must have dependency array.
- Empty array [] means mount only.
