import { getMockDiff, type MockFile } from '../../utils/github-fallback.js';
import { getMCPTools } from '../../mcp-tools.js';
import type { DiffFile } from './types.js';

export async function fetchDiff(prNumber: number): Promise<DiffFile[]> {
  console.log('1️⃣ Получение диффа...');

  const useRealGitHub = process.env.USE_REAL_GITHUB_API === 'true';

  if (!useRealGitHub) {
    console.log('   📦 Использую мок-данные');
    return getMockDiff();
  }

  let tools;
  try {
    tools = await getMCPTools();
  } catch {
    console.log('   ⚠️ MCP недоступен, использую мок-данные');
    return getMockDiff();
  }

  const diffTool = tools.find((t: any) => t.name === 'get_pull_request_diff');
  if (!diffTool) {
    return getMockDiff();
  }

  try {
    const diffRaw = await diffTool.invoke(JSON.stringify({ prNumber }));
    const parsed = JSON.parse(diffRaw);

    if ((parsed as any).error) {
      console.log('   ⚠️ GitHub API error, использую мок-данные');
      return getMockDiff();
    }

    console.log(`   Файлов: ${parsed.length}`);
    return parsed;
  } catch {
    console.log('   ⚠️ Ошибка, использую мок-данные');
    return getMockDiff();
  }
}
