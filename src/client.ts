import type { Provider } from './providers';

const ZEN_BASE = 'https://opencode.ai/zen/v1';

const CLAUDE_MODELS = ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5', 'claude-3-5-haiku'];
const GEMINI_MODELS = ['gemini-3-pro', 'gemini-3-flash'];
const RESPONSES_MODELS = ['gpt-5-nano'];

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
        const error = await response.text();
        throw new Error(`API error: ${response.status} ${error}`);
      }

      return response.json();
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
