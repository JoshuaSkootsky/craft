import { AVAILABLE, type Provider } from './providers';
import { isModelFree } from './client.js';

export interface ZenModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  context_length?: number;
}

export async function fetchZenModels(): Promise<ZenModel[]> {
  const zenProvider = AVAILABLE.find(p => p.provider === 'zen');
  if (!zenProvider) return [];

  try {
    const response = await fetch('https://opencode.ai/zen/v1/models', {
      headers: {
        'Authorization': `Bearer ${zenProvider.key}`,
      },
    });
    if (!response.ok) return [];
    const data = await response.json() as { data: ZenModel[] };
    return data.data || [];
  } catch {
    return [];
  }
}

function displayModels(models: ZenModel[]): void {
  const sortedModels = [...models].sort((a, b) => {
    const aFree = isModelFree(a.id);
    const bFree = isModelFree(b.id);
    if (aFree && !bFree) return -1;
    if (!aFree && bFree) return 1;
    return a.id.localeCompare(b.id);
  });

  console.log('\nAvailable models:');
  sortedModels.forEach((model, i) => {
    const badge = isModelFree(model.id) ? '[free]' : '';
    console.log(`  ${i + 1}. ${model.id} ${badge}`);
  });
}

async function readLine(): Promise<string> {
  const iterator = process.stdin.iterator();
  const result = await iterator.next();

  const decoder = new TextDecoder();
  const line = result.value ? decoder.decode(result.value).trimEnd() : '';

  await iterator.return?.();
  return line;
}

export interface ProviderChoice {
  provider: 'zen';
  key: string;
  label: string;
  model?: string;
}

export async function pickProvider(): Promise<ProviderChoice> {
  console.log('Detected LLM keys:');
  AVAILABLE.forEach((c, i) => console.log(`  ${i + 1}. ${c.label}`));

  if (AVAILABLE.length === 1) {
    const provider = AVAILABLE[0]!;
    if (provider.provider === 'zen') {
      let models = await fetchZenModels();
      models = [...models].sort((a, b) => {
        const aFree = isModelFree(a.id);
        const bFree = isModelFree(b.id);
        if (aFree && !bFree) return -1;
        if (!aFree && bFree) return 1;
        return a.id.localeCompare(b.id);
      });
      displayModels(models);

      let selectedIndex = 0;
      if (models.length > 1) {
        console.log(`\nSelect model (1-${models.length}): `);
        const input = await readLine();
        const num = parseInt(input);
        if (!isNaN(num) && num > 0 && num <= models.length) {
          selectedIndex = num - 1;
        }
      }

      const selectedModel = models[selectedIndex]?.id || models[0]?.id;
      console.log(`Using ${selectedModel}\n`);

      return {
        provider: 'zen',
        key: provider.key,
        label: provider.label,
        model: selectedModel,
      };
    }

    console.log(`Using ${provider.label}\n`);
    return { provider: provider.provider, key: provider.key, label: provider.label };
  }

  const envChoice = process.env.DEFAULT_PROVIDER;
  if (envChoice) {
    const found = AVAILABLE.find(c => c.provider === envChoice);
    if (found) {
      console.log(`Using ${found.label} (from DEFAULT_PROVIDER)\n`);
      return { provider: found.provider, key: found.key, label: found.label };
    }
  }

  if (AVAILABLE.length > 0) {
    const first = AVAILABLE[0]!;
    return { provider: first.provider, key: first.key, label: first.label };
  }

  console.error('No providers available');
  process.exit(1);
}
