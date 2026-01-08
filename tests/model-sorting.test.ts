import { describe, it, expect, beforeAll } from 'bun:test';
import { fetchZenModels, type ZenModel } from '../src/picker';
import { initPricing, isModelFree, getPricing } from '../src/client';

describe('model sorting', () => {
  beforeAll(async () => {
    await initPricing();
  });

  it('should identify free models correctly', () => {
    const freeModels = ['big-pickle', 'glm-4.7-free', 'gpt-5-nano', 'grok-code', 'minimax-m2.1-free'];
    const paidModels = ['qwen3-coder', 'claude-haiku-4-5', 'claude-opus-4-5'];

    for (const model of freeModels) {
      expect(isModelFree(model)).toBe(true);
    }

    for (const model of paidModels) {
      expect(isModelFree(model)).toBe(false);
    }
  });

  it('should sort free models before paid models', () => {
    const models: ZenModel[] = [
      { id: 'qwen3-coder', object: 'model', created: 0, owned_by: 'zen' },
      { id: 'big-pickle', object: 'model', created: 0, owned_by: 'zen' },
      { id: 'claude-opus-4-5', object: 'model', created: 0, owned_by: 'zen' },
      { id: 'grok-code', object: 'model', created: 0, owned_by: 'zen' },
    ];

    const sorted = [...models].sort((a, b) => {
      const aFree = isModelFree(a.id);
      const bFree = isModelFree(b.id);
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      return a.id.localeCompare(b.id);
    });

    // First two should be free
    expect(isModelFree(sorted[0]!.id)).toBe(true);
    expect(isModelFree(sorted[1]!.id)).toBe(true);
    // Last two should be paid
    expect(isModelFree(sorted[2]!.id)).toBe(false);
    expect(isModelFree(sorted[3]!.id)).toBe(false);
  });

  it('should maintain alphabetical order within free models', () => {
    const models: ZenModel[] = [
      { id: 'grok-code', object: 'model', created: 0, owned_by: 'zen' },
      { id: 'big-pickle', object: 'model', created: 0, owned_by: 'zen' },
    ];

    const sorted = [...models].sort((a, b) => {
      const aFree = isModelFree(a.id);
      const bFree = isModelFree(b.id);
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      return a.id.localeCompare(b.id);
    });

    expect(sorted[0]!.id).toBe('big-pickle');
    expect(sorted[1]!.id).toBe('grok-code');
  });

  it('should maintain alphabetical order within paid models', () => {
    const models: ZenModel[] = [
      { id: 'qwen3-coder', object: 'model', created: 0, owned_by: 'zen' },
      { id: 'claude-haiku-4-5', object: 'model', created: 0, owned_by: 'zen' },
    ];

    const sorted = [...models].sort((a, b) => {
      const aFree = isModelFree(a.id);
      const bFree = isModelFree(b.id);
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      return a.id.localeCompare(b.id);
    });

    expect(sorted[0]!.id).toBe('claude-haiku-4-5');
    expect(sorted[1]!.id).toBe('qwen3-coder');
  });

  it('should handle empty array', () => {
    const models: ZenModel[] = [];
    const sorted = models.sort((a, b) => {
      const aFree = isModelFree(a.id);
      const bFree = isModelFree(b.id);
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      return a.id.localeCompare(b.id);
    });

    expect(sorted.length).toBe(0);
  });

  it('should handle models with unknown pricing', () => {
    const models: ZenModel[] = [
      { id: 'unknown-model', object: 'model', created: 0, owned_by: 'test' },
      { id: 'grok-code', object: 'model', created: 0, owned_by: 'zen' },
    ];

    const sorted = [...models].sort((a, b) => {
      const aFree = isModelFree(a.id);
      const bFree = isModelFree(b.id);
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      return a.id.localeCompare(b.id);
    });

    // Unknown models are treated as paid, so grok-code should come first
    expect(sorted[0]!.id).toBe('grok-code');
    expect(sorted[1]!.id).toBe('unknown-model');
  });
});
