import { homedir } from 'os';
import { resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { config } from 'dotenv';

const cfgDir = resolve(homedir(), '.config', 'craft');
const cfgEnv = resolve(cfgDir, '.env');

export function loadUserEnv() {
  if (existsSync(cfgEnv)) config({ path: cfgEnv });
}

export function writeUserEnv(values: Record<string, string>) {
  mkdirSync(cfgDir, { recursive: true });
  const lines = Object.entries(values)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  writeFileSync(cfgEnv, lines + '\n');
}
