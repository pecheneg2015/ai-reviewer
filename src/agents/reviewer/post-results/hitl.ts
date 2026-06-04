import { getMCPTools } from '../../../mcp-tools.js';
import { requiresHumanReview } from '../../../guards/criticality-classifier.js';
import type { Criticality } from '../../../guards/criticality-classifier.js';
import { askConfirmation, formatViolationForHITL } from '../../../hitl.js';
import type { Violation } from './types.js';

export async function processHITL(violations: Violation[], prNumber: number): Promise<{ confirmed: number; skipped: number }> {
  const hitlViolations = violations.filter((v) => requiresHumanReview(v.criticality as Criticality));
  if (hitlViolations.length === 0) return { confirmed: 0, skipped: 0 };

  console.log(`\n⏳ Требуется подтверждение для ${hitlViolations.length} нарушений:`);

  const commentTool = await getCommentTool();
  let confirmed = 0;
  let skipped = 0;

  for (let i = 0; i < hitlViolations.length; i++) {
    const v = hitlViolations[i];
    console.log(formatViolationForHITL(v, i, hitlViolations.length));

    const approved = await askConfirmation('');

    if (approved && commentTool) {
      const ok = await tryPost(commentTool, prNumber, v);
      if (ok) {
        confirmed++;
        console.log('   ✅ Опубликовано');
      } else {
        console.log('   ⚠️ Не удалось опубликовать');
      }
    } else if (approved) {
      v.posted = true;
      confirmed++;
      console.log('   ✅ Подтверждено (мок)');
    } else {
      v.posted = false;
      skipped++;
      console.log('   ❌ Пропущено');
    }
  }

  return { confirmed, skipped };
}

async function tryPost(tool: any, prNumber: number, v: Violation): Promise<boolean> {
  try {
    await tool.invoke(JSON.stringify({
      prNumber,
      file: v.file,
      line: v.line,
      text: `🤖 **AI Code Review:** ${v.text}.`,
    }));
    v.posted = true;
    return true;
  } catch {
    return false;
  }
}

async function getCommentTool(): Promise<any | null> {
  try {
    const tools = await getMCPTools();
    return tools.find((t: any) => t.name === 'post_review_comment') || null;
  } catch {
    return null;
  }
}
