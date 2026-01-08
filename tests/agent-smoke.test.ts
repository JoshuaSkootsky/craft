import { describe, it, expect, beforeAll } from 'bun:test';
import { initPricing, getPricing, isModelFree, parseResponse } from '../src/client';

describe('agent smoke tests', () => {
  beforeAll(async () => {
    await initPricing();
  });

  it('should export required functions from client', () => {
    expect(typeof initPricing).toBe('function');
    expect(typeof getPricing).toBe('function');
    expect(typeof isModelFree).toBe('function');
    expect(typeof parseResponse).toBe('function');
  });

  it('should parse OpenAI chat response correctly', () => {
    const response = parseResponse({
      choices: [{
        message: {
          content: 'Hello, I am craft'
        }
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5
      }
    });

    expect(response.content).toBe('Hello, I am craft');
    expect(response.usage?.prompt_tokens).toBe(10);
    expect(response.usage?.completion_tokens).toBe(5);
  });

  it('should handle reasoning content format', () => {
    const response = parseResponse({
      choices: [{
        message: {
          content: '',
          reasoning_content: 'Reasoning here'
        }
      }],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 10
      }
    });

    expect(response.content).toBe('Reasoning here');
    expect(response.usage?.prompt_tokens).toBe(20);
  });

  it('should identify free models correctly', () => {
    expect(isModelFree('grok-code')).toBe(true);
    expect(isModelFree('big-pickle')).toBe(true);
    expect(isModelFree('qwen3-coder')).toBe(false);
    expect(isModelFree('claude-opus-4-5')).toBe(false);
  });

  it('should calculate costs correctly', () => {
    const grokCodePricing = getPricing('grok-code');
    expect(grokCodePricing?.inputPerM).toBe(0);
    expect(grokCodePricing?.outputPerM).toBe(0);

    const qwenPricing = getPricing('qwen3-coder');
    expect(qwenPricing?.inputPerM).toBe(0.45);
    expect(qwenPricing?.outputPerM).toBe(1.50);

    // Cost for 1M input tokens + 1M output tokens
    const inputCost = (1_000_000 / 1_000_000) * qwenPricing!.inputPerM;
    const outputCost = (1_000_000 / 1_000_000) * qwenPricing!.outputPerM;
    expect(inputCost + outputCost).toBe(1.95);
  });

  it('should have consistent pricing data', () => {
    const allPricing = [
      { model: 'big-pickle', input: 0, output: 0 },
      { model: 'grok-code', input: 0, output: 0 },
      { model: 'minimax-m2.1-free', input: 0, output: 0 },
      { model: 'glm-4.7-free', input: 0, output: 0 },
      { model: 'gpt-5-nano', input: 0, output: 0 },
      { model: 'qwen3-coder', input: 0.45, output: 1.50 },
      { model: 'claude-haiku-4-5', input: 1.00, output: 5.00 },
      { model: 'claude-opus-4-5', input: 5.00, output: 25.00 },
    ];

    for (const { model, input, output } of allPricing) {
      const pricing = getPricing(model);
      expect(pricing?.inputPerM).toBe(input);
      expect(pricing?.outputPerM).toBe(output);
      expect(isModelFree(model)).toBe(input === 0 && output === 0);
    }
  });
});
