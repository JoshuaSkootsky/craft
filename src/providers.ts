import { loadUserEnv } from './config.js';
import { existsSync } from 'fs';
import { config } from 'dotenv';

loadUserEnv();

if (existsSync('.env')) config();

export type Provider = 'zen';

export interface ProviderChoice {
  provider: Provider;
  key: string;
  label: string;
}

const ZEN_KEY = process.env.API_KEY_ZEN;

if (!ZEN_KEY) {
  console.error(
    'No Zen API key found.\n' +
    'Add API_KEY_ZEN to ~/.config/craft/.env\n' +
    'Get your key at https://opencode.ai/auth'
  );
  process.exit(1);
}

export const AVAILABLE: ProviderChoice[] = [{
  provider: 'zen',
  key: ZEN_KEY,
  label: 'Open Code Zen'
}];
