import { describe, it, expect, beforeAll } from 'bun:test';
import { initPricing, getPricing, isModelFree } from '../src/client';

describe('cost calculation', () => {
  beforeAll(async () => {
    await initPricing();
  });

  describe('getPricing', () => {
    it('should return pricing for free models', () => {
      const pricing = getPricing('grok-code');
      expect(pricing).toEqual({ inputPerM: 0, outputPerM: 0 });
    });

    it('should return pricing for paid models', () => {
      const pricing = getPricing('qwen3-coder');
      expect(pricing).toEqual({ inputPerM: 0.45, outputPerM: 1.50 });
    });

    it('should return pricing for Claude models', () => {
      const pricing = getPricing('claude-haiku-4-5');
      expect(pricing).toEqual({ inputPerM: 1.00, outputPerM: 5.00 });
    });

    it('should return pricing for expensive models', () => {
      const pricing = getPricing('claude-opus-4-1');
      expect(pricing).toEqual({ inputPerM: 15.00, outputPerM: 75.00 });
    });

    it('should return null for unknown models', () => {
      const pricing = getPricing('unknown-model');
      expect(pricing).toBeNull();
    });
  });

  describe('isModelFree', () => {
    it('should return true for grok-code', () => {
      expect(isModelFree('grok-code')).toBe(true);
    });

    it('should return true for big-pickle', () => {
      expect(isModelFree('big-pickle')).toBe(true);
    });

    it('should return true for gpt-5-nano', () => {
      expect(isModelFree('gpt-5-nano')).toBe(true);
    });

    it('should return false for qwen3-coder', () => {
      expect(isModelFree('qwen3-coder')).toBe(false);
    });

    it('should return false for claude models', () => {
      expect(isModelFree('claude-haiku-4-5')).toBe(false);
      expect(isModelFree('claude-opus-4-5')).toBe(false);
    });

    it('should return false for unknown models', () => {
      expect(isModelFree('unknown-model')).toBe(false);
    });
  });

  describe('cost calculation', () => {
    it('should calculate cost for qwen3-coder (input heavy)', () => {
      const pricing = getPricing('qwen3-coder')!;
      const inputTokens = 1000000;
      const outputTokens = 100;
      const inputCost = (inputTokens / 1_000_000) * pricing.inputPerM;
      const outputCost = (outputTokens / 1_000_000) * pricing.outputPerM;
      expect(inputCost).toBeCloseTo(0.45, 4);
      expect(outputCost).toBeCloseTo(0.00015, 5);
    });

    it('should calculate cost for claude-opus-4-5', () => {
      const pricing = getPricing('claude-opus-4-5')!;
      const inputTokens = 100000;
      const outputTokens = 1000;
      const inputCost = (inputTokens / 1_000_000) * pricing.inputPerM;
      const outputCost = (outputTokens / 1_000_000) * pricing.outputPerM;
      expect(inputCost).toBeCloseTo(0.50, 2);
      expect(outputCost).toBeCloseTo(0.025, 3);
    });

    it('should handle zero tokens (free)', () => {
      const pricing = getPricing('grok-code')!;
      const inputCost = (0 / 1_000_000) * pricing.inputPerM;
      const outputCost = (0 / 1_000_000) * pricing.outputPerM;
      expect(inputCost).toBe(0);
      expect(outputCost).toBe(0);
    });
  });
});
