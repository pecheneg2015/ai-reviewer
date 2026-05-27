import dotenv from 'dotenv';
dotenv.config();

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  console.log('🔌 Подключение к MCP-серверу...\n');

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', 'src/mcp-server/server.ts'],
  });

  const client = new Client(
    { name: 'ai-code-reviewer-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('✅ Подключено\n');

  // Список инструментов
  const tools = await client.listTools();
  console.log('📦 Доступные инструменты:');
  for (const tool of tools.tools) {
    console.log(`   - ${tool.name}`);
  }

  // Тест get_pull_request_diff
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 Тест get_pull_request_diff');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const diffResult = await client.callTool({
    name: 'get_pull_request_diff',
    arguments: { prNumber: 1 },
  });

  const diffText = (diffResult.content as any)[0]?.text || '';
  try {
    const diff = JSON.parse(diffText);
    if (diff.error) {
      console.log(`❌ ${diff.error}`);
    } else {
      for (const file of diff) {
        console.log(`📄 ${file.filename} (${file.status})`);
        console.log(file.patch.slice(0, 200));
        console.log('');
      }
    }
  } catch {
    console.log(diffText);
  }

  // Тест post_review_comment (закомментирован для безопасности)
  // console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // console.log('💬 Тест post_review_comment');
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  //
  // const commentResult = await client.callTool({
  //   name: 'post_review_comment',
  //   arguments: {
  //     prNumber: 1,
  //     file: 'src/Button.tsx',
  //     line: 3,
  //     text: '⚠️ **AI Code Review:** обработчики событий должны начинаться с `handle`. `btnClck` → `handleClick`. См. naming-conventions.md.',
  //   },
  // });

  await client.close();
  console.log('✅ Тест завершён.');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err.message);
  process.exit(1);
});
