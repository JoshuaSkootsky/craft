import type { Provider } from './providers';
import { AVAILABLE } from './providers';

const ZEN_BASE = 'https://opencode.ai/zen/v1';

const CLAUDE_MODELS = ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5', 'claude-3-5-haiku'];
const GEMINI_MODELS = ['gemini-3-pro', 'gemini-3-flash'];
const RESPONSES_MODELS = ['gpt-5-nano'];

interface ZenModel {
  id: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

const ZEN_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  'big-pickle': { inputPerM: 0, outputPerM: 0 },
  'grok-code': { inputPerM: 0, outputPerM: 0 },
  'minimax-m2.1-free': { inputPerM: 0, outputPerM: 0 },
  'glm-4.7-free': { inputPerM: 0, outputPerM: 0 },
  'gpt-5-nano': { inputPerM: 0, outputPerM: 0 },
  'glm-4.6': { inputPerM: 0.60, outputPerM: 2.20 },
  'kimi-k2': { inputPerM: 0.40, outputPerM: 2.50 },
  'kimi-k2-thinking': { inputPerM: 0.40, outputPerM: 2.50 },
  'qwen3-coder': { inputPerM: 0.45, outputPerM: 1.50 },
  'claude-haiku-4-5': { inputPerM: 1.00, outputPerM: 5.00 },
  'claude-3-5-haiku': { inputPerM: 0.80, outputPerM: 4.00 },
  'claude-sonnet-4-5': { inputPerM: 3.00, outputPerM: 15.00 },
  'claude-sonnet-4': { inputPerM: 3.00, outputPerM: 15.00 },
  'claude-opus-4-5': { inputPerM: 5.00, outputPerM: 25.00 },
  'claude-opus-4-1': { inputPerM: 15.00, outputPerM: 75.00 },
  'gemini-3-pro': { inputPerM: 2.00, outputPerM: 12.00 },
  'gemini-3-flash': { inputPerM: 0.50, outputPerM: 3.00 },
  'gpt-5.2': { inputPerM: 1.75, outputPerM: 14.00 },
  'gpt-5.1': { inputPerM: 1.07, outputPerM: 8.50 },
  'gpt-5.1-codex': { inputPerM: 1.07, outputPerM: 8.50 },
  'gpt-5.1-codex-max': { inputPerM: 1.25, outputPerM: 10.00 },
  'gpt-5.1-codex-mini': { inputPerM: 0.25, outputPerM: 2.00 },
  'gpt-5': { inputPerM: 1.07, outputPerM: 8.50 },
  'gpt-5-codex': { inputPerM: 1.07, outputPerM: 8.50 },
};

let pricingCache: Map<string, { inputPerM: number; outputPerM: number }> | null = null;

async function fetchPricing(): Promise<Map<string, { inputPerM: number; outputPerM: number }>> {
  const cache = new Map(Object.entries(ZEN_PRICING));
  return cache;
}

export async function initPricing(): Promise<void> {
  pricingCache = await fetchPricing();
}

export function getPricing(modelId: string): { inputPerM: number; outputPerM: number } | null {
  return pricingCache?.get(modelId) || null;
}

export function isModelFree(modelId: string): boolean {
  const pricing = getPricing(modelId);
  if (!pricing) return false;
  return pricing.inputPerM === 0 && pricing.outputPerM === 0;
}

export function extractContent(data: Record<string, any>): string {
  if (!data) return '';

  if (typeof data.content === 'string' && data.content.trim()) {
    return data.content;
  }

  if (Array.isArray(data.choices)) {
    const choice = data.choices[0];
    if (!choice) return '';

    if (typeof choice.message?.content === 'string' && choice.message.content.trim()) {
      return choice.message.content;
    }

    if (typeof choice.message?.reasoning_content === 'string' && choice.message.reasoning_content.trim()) {
      return choice.message.reasoning_content;
    }

    if (Array.isArray(choice.content)) {
      const contentBlock = choice.content.find((b: any) => b.type === 'text');
      if (contentBlock?.text) return contentBlock.text;
      if (choice.content[0]?.text) return choice.content[0].text;
    }

    if (typeof choice.delta?.content === 'string' && choice.delta.content.trim()) {
      return choice.delta.content;
    }
  }

  if (typeof data.output?.text === 'string' && data.output.text.trim()) {
    return data.output.text;
  }

  if (typeof data.text === 'string' && data.text.trim()) {
    return data.text;
  }

  if (typeof data.completion === 'string' && data.completion.trim()) {
    return data.completion;
  }

  if (typeof data.message?.content === 'string' && data.message.content.trim()) {
    return data.message.content;
  }

  return '';
}

export interface ParsedResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  } | null;
  raw: Record<string, any>;
}

export function extractUsage(data: Record<string, any>): {
  prompt_tokens: number;
  completion_tokens: number;
} | null {
  if (!data) return null;

  const usage = data.usage || data.Usage || data.usage_stats;
  if (!usage) return null;

  return {
    prompt_tokens: usage.prompt_tokens || usage.inputTokens || usage.input_tokens || 0,
    completion_tokens: usage.completion_tokens || usage.outputTokens || usage.output_tokens || 0,
  };
}

export function parseResponse(data: Record<string, any>): ParsedResponse {
  return {
    content: extractContent(data),
    usage: extractUsage(data),
    raw: data,
  };
}

export function toolsFor(provider: Provider, key: string, model?: string) {
  const selectedModel = model || getDefaultModel(provider);

  return {
    chat: async (body: any) => {
      const url = getEndpoint(provider, selectedModel);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (provider === 'zen') {
        headers['Authorization'] = `Bearer ${key}`;
      } else if (provider === 'openai') {
        headers['Authorization'] = `Bearer ${key}`;
      } else if (provider === 'claude') {
        headers['x-api-key'] = key;
        headers['anthropic-version'] = '2023-06-01';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, model: selectedModel }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let userMessage: string;
        try {
          const errorData = JSON.parse(errorText);
          const errorMsg = errorData?.error?.message || errorData?.message || errorText;
          userMessage = `Server error from ${provider}: ${errorMsg}`;
        } catch {
          const errorMap: Record<number, string> = {
            401: `Invalid API key for ${provider}. Check ~/.config/craft/.env`,
            429: `Rate limit exceeded for ${provider}. Retrying...`,
            404: `Model '${selectedModel}' not found for ${provider}`,
            500: `Server error from ${provider}. Please try again.`,
            503: `Service unavailable. Please try again later.`
          };
          userMessage = errorMap[response.status] || `API error: ${response.status}`;
        }
        throw new Error(`${userMessage}\nDetails: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json() as Record<string, any>;
      const parsed = parseResponse(data);
      const debugEnabled = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
      if (debugEnabled) {
        console.log('[debug] response format:', {
          hasChoices: Array.isArray(data.choices),
          hasUsage: !!data.usage,
          contentLength: parsed.content.length,
          usage: parsed.usage,
          keys: Object.keys(data).slice(0, 10),
        });
      }
      return { ...data, _usage: parsed.usage, _content: parsed.content, _parsed: parsed };
    },
    run_command: async (payload: { command: string }) => {
      const shell = Bun.which('sh') || '/bin/sh';
      const proc = Bun.spawn([shell, '-c', payload.command], {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const output = await new Response(proc.stdout).text();
      const error = await new Response(proc.stderr).text();
      return { output, error, code: proc.exitCode };
    },
    run_terminal_cmd: async (payload: { command: string }) => {
      const shell = Bun.which('sh') || '/bin/sh';
      const proc = Bun.spawn([shell, '-c', payload.command], {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const output = await new Response(proc.stdout).text();
      const error = await new Response(proc.stderr).text();
      return { output, error, code: proc.exitCode };
    },
    execute: async (payload: { command: string }) => {
      const proc = Bun.spawn(payload.command.split(' '), {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const output = await new Response(proc.stdout).text();
      const error = await new Response(proc.stderr).text();
      return { output, error, code: proc.exitCode };
    },
    run: async (payload: { command: string }) => {
      const proc = Bun.spawn(payload.command.split(' '), {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const output = await new Response(proc.stdout).text();
      const error = await new Response(proc.stderr).text();
      return { output, error, code: proc.exitCode };
    },
    generate: async (payload: { content: string; path: string }) => {
      await Bun.write(payload.path, payload.content);
      return { success: true, path: payload.path };
    },
    write_file: async (payload: { content: string; path?: string; file_path?: string }) => {
      const filePath = payload.path || payload.file_path;
      await Bun.write(filePath!, payload.content);
      return { success: true, path: filePath };
    },
    create_file: async (payload: { content: string; path: string }) => {
      await Bun.write(payload.path, payload.content);
      return { success: true, path: payload.path };
    },
    edit_file: async (payload: { file_path?: string; path?: string; old_string?: string; new_string?: string; content?: string }) => {
      const filePath = payload.file_path || payload.path;
      if (!filePath) {
        return { success: false, error: 'No file path provided' };
      }
      if (payload.new_string !== undefined) {
        const current = await Bun.file(filePath).text();
        const updated = current.replace(payload.old_string || '', payload.new_string);
        await Bun.write(filePath, updated);
        return { success: true, path: filePath };
      }
      if (payload.content !== undefined) {
        await Bun.write(filePath, payload.content);
        return { success: true, path: filePath };
      }
      return { success: false, error: 'No content provided' };
    },
    read_file: async (payload: { path: string }) => {
      const content = await Bun.file(payload.path).text();
      return { content };
    },
    read_file_from_disk: async (payload: { path: string }) => {
      const content = await Bun.file(payload.path).text();
      return { content };
    },
    glob: async (payload: { pattern: string }) => {
      const files = await globAsync(payload.pattern);
      return { files };
    },
    search: async (payload: { pattern: string; path?: string }) => {
      const dir = payload.path || '.';
      const proc = Bun.spawn(['rg', payload.pattern, dir, '--files', '--recursive'], {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const output = await new Response(proc.stdout).text();
      return { matches: output.trim().split('\n').filter(Boolean) };
    },
  };
}

function getDefaultModel(provider: Provider): string {
  switch (provider) {
    case 'zen': return 'grok-code';
    case 'openai': return 'gpt-4o';
    case 'claude': return 'claude-sonnet-4-5';
  }
}

function getEndpoint(provider: Provider, model: string): string {
  if (provider === 'zen') {
    if (CLAUDE_MODELS.includes(model)) {
      return `${ZEN_BASE}/messages`;
    }
    if (GEMINI_MODELS.includes(model)) {
      return `${ZEN_BASE}/models/${model}`;
    }
    if (RESPONSES_MODELS.includes(model)) {
      return `${ZEN_BASE}/responses`;
    }
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

async function globAsync(pattern: string): Promise<string[]> {
  const files: string[] = [];
  const proc = Bun.spawn(['find', '.', '-type', 'f', '-name', pattern.replace('*', '*')], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const output = await new Response(proc.stdout).text();
  return output.trim().split('\n').filter(Boolean);
}
