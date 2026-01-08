import type { Provider } from './providers';

export function validateKeyFormat(provider: Provider, key: string): { valid: boolean; reason?: string } {
  const trimmed = key.trim();

  if (!trimmed) {
    return { valid: false, reason: 'Key is empty' };
  }

  switch (provider) {
    case 'openai':
      if (!/^sk-[a-zA-Z0-9]{20,}$/.test(trimmed)) {
        return { valid: false, reason: 'OpenAI key must start with "sk-"' };
      }
      break;

    case 'claude':
      if (!/^sk-ant-[a-zA-Z0-9]{16,}$/.test(trimmed)) {
        return { valid: false, reason: 'Claude key must start with "sk-ant-"' };
      }
      break;

    case 'zen':
      if (trimmed.length < 10) {
        return { valid: false, reason: 'Zen key appears too short' };
      }
      break;
  }

  return { valid: true };
}
