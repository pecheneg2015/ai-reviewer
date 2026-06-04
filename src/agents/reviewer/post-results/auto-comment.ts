import { getMCPTools } from '../../../mcp-tools.js';
import { requiresHumanReview } from '../../../guards/criticality-classifier.js';
import type { Criticality } from '../../../guards/criticality-classifier.js';
import type { Violation } from './types.js';

export async function postAutoComments(violations: Violation[], prNumber: number): Promise<number> {
  const autoViolations = violations.filter((v) => !requiresHumanReview(v.criticality as Criticality));
  if (autoViolations.length === 0) return 0;

  const commentTool = await getCommentTool();
  let count = 0;

  for (const v of autoViolations) {
    const ok = await tryPostComment(commentTool, prNumber, v);
    if (ok) count++;
  }

  return count;
}

async function tryPostComment(tool: any, prNumber: number, v: Violation): Promise<boolean> {
  if (!tool) {
    v.posted = true; // мок-режим
    return true;
  }

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
