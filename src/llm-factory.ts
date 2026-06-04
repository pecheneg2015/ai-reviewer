import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/community/chat_models/ollama';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getGigaChatToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.GIGACHAT_CLIENT_ID;
  const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GIGACHAT_CLIENT_ID и GIGACHAT_CLIENT_SECRET не заданы');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'scope=GIGACHAT_API_PERS',
  });

  if (!response.ok) {
    throw new Error(`GigaChat auth failed: ${response.status}`);
  }

  const data = await response.json();

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  console.log('🔑 GigaChat токен обновлён');
  return cachedToken!;
}

export async function createLLM() {
  // GigaChat через OpenAI-совместимый API
  if (process.env.USE_GIGACHAT === 'true') {
    const token = await getGigaChatToken();
    return new ChatOpenAI({
      model: 'GigaChat-Pro',
      temperature: 0,
      apiKey: token,
      configuration: {
        baseURL: 'https://gigachat.devices.sberbank.ru/api/v1',
        defaultHeaders: {
          'X-Request-ID': crypto.randomUUID(),
        },
      },
      fetchOptions: {
        rejectUnauthorized: false,
      },
    } as any);
  }

  // Ollama
  return new ChatOllama({
    model: process.env.OLLAMA_LLM_MODEL || 'qwen2.5-coder:7b',
    baseUrl: process.env.OLLAMA_BASE_URL,
    temperature: 0,
  });
}
