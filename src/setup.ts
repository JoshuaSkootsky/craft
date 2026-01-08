#!/usr/bin/env bun
import { writeUserEnv } from './config.js';
import { stdin, stdout } from 'process';
import * as readline from 'readline';

const rl = readline.createInterface({ input: stdin, output: stdout });
const ask = (q: string) => new Promise<string>(r => rl.question(q, r));

(async () => {
  console.log('🛠  Welcome to craft! Lets add your keys (empty to skip):\n');
  const keys: Record<string, string> = {};
  keys.API_KEY_OPENAI = await ask('OpenAI key: ');
  keys.API_KEY_CLAUDE = await ask('Claude key: ');
  keys.API_KEY_ZEN = await ask('Zen key: ');
  writeUserEnv(keys);
  console.log('✅  Saved to ~/.config/craft/.env');
  rl.close();
})();
