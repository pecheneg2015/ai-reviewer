export type Criticality = 'critical' | 'high' | 'medium' | 'low';

export interface ClassifiedViolation {
  line: number;
  rule: string;
  criticality: Criticality;
}

const CRITICAL_PATTERNS = [
  /инъекци/i,
  /injection/i,
  /security override/i,
  /обход/i,
  /токен/i,
  /token/i,
  /парол/i,
  /password/i,
  /секрет/i,
  /secret/i,
];

const HIGH_PATTERNS = [
  /dangerouslySetInnerHTML/i,
  /document\.getElementById/i,
  /console\.log/i,
  /тест/i,
  /test/i,
  /доступност/i,
  /accessibility/i,
  /a11y/i,
  /alt/i,
  /aria/i,
];

const MEDIUM_PATTERNS = [
  /именован/i,
  /naming/i,
  /camelCase/i,
  /PascalCase/i,
  /handle/i,
  /обработчик/i,
  /handler/i,
  /хук/i,
  /hook/i,
  /пропс/i,
  /props/i,
];

/**
 * Классифицирует нарушение по критичности.
 */
export function classifyViolation(rule: string): Criticality {
  if (CRITICAL_PATTERNS.some((p) => p.test(rule))) {
    return 'critical';
  }
  if (HIGH_PATTERNS.some((p) => p.test(rule))) {
    return 'high';
  }
  if (MEDIUM_PATTERNS.some((p) => p.test(rule))) {
    return 'medium';
  }
  return 'low';
}

/**
 * Нужен ли HITL для этого уровня критичности.
 */
export function requiresHumanReview(criticality: Criticality): boolean {
  return criticality === 'critical' || criticality === 'high';
}

/**
 * Применяет классификацию к списку нарушений.
 */
export function classifyViolations(
  violations: Array<{ line: number; rule: string }>
): ClassifiedViolation[] {
  return violations.map((v) => ({
    ...v,
    criticality: classifyViolation(v.rule),
  }));
}
