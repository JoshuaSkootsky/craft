import type { Provider } from './providers';

const ZEN_BASE = 'https://opencode.ai/zen/v1';

function getEndpoint(provider: Provider, model: string): string {
  if (provider === 'zen') {
    return `${ZEN_BASE}/chat/completions`;
  }
  if (provider === 'openai') {
    return 'https://api.openai.com/v1/chat/completions';
  }
  if (provider === 'claude') {
    return 'https://api.anthropic.com/v1/messages';
  }
  return '';
}

function getHeaders(provider: Provider, key: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider === 'zen' || provider === 'openai') {
    headers['Authorization'] = `Bearer ${key}`;
  } else if (provider === 'claude') {
    headers['x-api-key'] = key;
    headers['anthropic-version'] = '2023-06-01';
  }

  return headers;
}

function getDefaultModel(provider: Provider): string {
  switch (provider) {
    case 'zen': return 'grok-code';
    case 'openai': return 'gpt-4o';
    case 'claude': return 'claude-sonnet-4-5';
  }
}

export async function validateKeyWorks(
  provider: Provider,
  key: string,
  model?: string
): Promise<{ valid: boolean; reason?: string }> {
  const selectedModel = model || getDefaultModel(provider);

  try {
    const testPayload = {
      model: selectedModel,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    };

    const url = getEndpoint(provider, selectedModel);
    const headers = getHeaders(provider, key);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
    });

    if (response.status === 401) {
      return { valid: false, reason: 'API key rejected (401 Unauthorized)' };
    }

    if (response.status === 429) {
      return { valid: true };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return { valid: false, reason: `API test failed: ${response.status} ${errorText.substring(0, 100)}` };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: `Network error: ${error}` };
  }
}
