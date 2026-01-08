import { AVAILABLE, type Provider } from './providers';

const FREE_MODELS = ['grok-code', 'big-pickle', 'minimax-m2.1-free', 'glm-4.7-free', 'gpt-5-nano'];

interface ZenModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ProviderChoice {
  provider: Provider;
  key: string;
  label: string;
  model?: string;
}

async function fetchZenModels(): Promise<string[]> {
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
    const allModels = data.data?.map(m => m.id) || [];
    return allModels.filter(m => FREE_MODELS.includes(m));
  } catch {
    return FREE_MODELS;
  }
}

function displayModels(models: string[]): void {
  console.log('\nAvailable Zen models (free):');
  models.forEach((model, i) => {
    console.log(`  ${i + 1}. ${model}`);
  });
}

async function readLine(): Promise<string> {
  try {
    const file = Bun.file('/dev/stdin');
    const text = await file.text();
    return text.trim();
  } catch {
    return '';
  }
}

export async function pickProvider(): Promise<ProviderChoice> {
  console.log('Detected LLM keys:');
  AVAILABLE.forEach((c, i) => console.log(`  ${i + 1}. ${c.label}`));

  if (AVAILABLE.length === 1) {
    const provider = AVAILABLE[0]!;
    if (provider.provider === 'zen') {
      const models = await fetchZenModels();
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

      const selectedModel = models[selectedIndex] || models[0];
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
