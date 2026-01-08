const ZEN_BASE = 'https://opencode.ai/zen/v1';

function getEndpoint(): string {
  return `${ZEN_BASE}/chat/completions`;
}

function getHeaders(key: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  };
}

function getDefaultModel(): string {
  return 'grok-code';
}

export async function validateKeyWorks(
  key: string,
  model?: string
): Promise<{ valid: boolean; reason?: string }> {
  const selectedModel = model || getDefaultModel();

  try {
    const testPayload = {
      model: selectedModel,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    };

    const url = getEndpoint();
    const headers = getHeaders(key);

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
