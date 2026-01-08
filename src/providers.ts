import { loadUserEnv } from './config.js';
import { existsSync } from 'fs';
import { config } from 'dotenv';

loadUserEnv();

if (existsSync('.env')) config();

export type Provider = 'openai' | 'claude' | 'zen';

interface Choice {
  provider: Provider;
  key: string;
  label: string;
}

const choices: Choice[] = [
  { provider: 'openai' as Provider, key: process.env.API_KEY_OPENAI!, label: 'OpenAI' },
  { provider: 'claude' as Provider, key: process.env.API_KEY_CLAUDE!, label: 'Anthropic' },
  { provider: 'zen' as Provider,    key: process.env.API_KEY_ZEN!,    label: 'Open Code Zen' },
];

export const AVAILABLE = choices.filter(c => c.key);

if (AVAILABLE.length === 0) {
  console.error(
    'No usable LLM keys found.\n' +
    'Run craft-setup to configure, or add keys to ~/.config/craft/.env'
  );
  process.exit(1);
}
