import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { DynamicTool } from '@langchain/core/tools';

let client: Client | null = null;

/**
 * Подключается к MCP-серверу и возвращает список инструментов LangChain.
 */
export async function getMCPTools(): Promise<DynamicTool[]> {
  if (!client) {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', 'src/mcp-server/server.ts'],
    });

    client = new Client(
      { name: 'ai-code-reviewer', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
    console.log('🔌 MCP-клиент подключён');
  }

  const mcpTools = await client.listTools();

  const langchainTools = mcpTools.tools.map(
    (t) =>
      new DynamicTool({
        name: t.name,
        description: t.description || '',
        func: async (input: string) => {
          let args: Record<string, unknown>;
          try {
            args = JSON.parse(input);
          } catch {
            args = { query: input };
          }

          const result = await client!.callTool({
            name: t.name,
            arguments: args,
          });

          const content = (result.content as Array<{ type: string; text?: string }>)
            .filter((c) => c.type === 'text')
            .map((c) => c.text || '')
            .join('\n');

          return content;
        },
      })
  );

  return langchainTools;
}

/**
 * Закрывает MCP-клиент.
 */
export async function closeMCPClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
