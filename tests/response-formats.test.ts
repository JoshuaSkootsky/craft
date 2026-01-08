import { describe, it, expect } from 'bun:test';
import { extractContent, extractUsage, parseResponse } from '../src/client';

describe('extractContent', () => {
  it('should extract from OpenAI chat format', () => {
    const data = {
      choices: [{
        message: {
          content: 'Hello, I am craft'
        }
      }]
    };
    expect(extractContent(data)).toBe('Hello, I am craft');
  });

  it('should extract from reasoning_content (big-pickle format)', () => {
    const data = {
      choices: [{
        message: {
          content: '',
          reasoning_content: 'Reasoning response here'
        }
      }]
    };
    expect(extractContent(data)).toBe('Reasoning response here');
  });

  it('should prefer content over reasoning_content', () => {
    const data = {
      choices: [{
        message: {
          content: 'Actual content',
          reasoning_content: 'Reasoning content'
        }
      }]
    };
    expect(extractContent(data)).toBe('Actual content');
  });

  it('should extract from Anthropic content array', () => {
    const data = {
      choices: [{
        content: [
          { type: 'text', text: 'Response text' }
        ]
      }]
    };
    expect(extractContent(data)).toBe('Response text');
  });

  it('should extract from first content block text', () => {
    const data = {
      choices: [{
        content: [
          { type: 'text', text: 'First block' }
        ]
      }]
    };
    expect(extractContent(data)).toBe('First block');
  });

  it('should extract from output.text (OpenAI responses)', () => {
    const data = {
      output: {
        text: 'Output response'
      }
    };
    expect(extractContent(data)).toBe('Output response');
  });

  it('should extract from direct text field', () => {
    const data = {
      text: 'Direct text response'
    };
    expect(extractContent(data)).toBe('Direct text response');
  });

  it('should extract from completion field', () => {
    const data = {
      completion: 'Completion response'
    };
    expect(extractContent(data)).toBe('Completion response');
  });

  it('should extract from top-level message.content', () => {
    const data = {
      message: {
        content: 'Top-level message'
      }
    };
    expect(extractContent(data)).toBe('Top-level message');
  });

  it('should return empty string for missing data', () => {
    expect(extractContent(undefined as any)).toBe('');
    expect(extractUsage(undefined as any)).toBe(null);
  });

  it('should handle zero values', () => {
    const data = {
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0
      }
    };
    const result = extractUsage(data);
    expect(result?.prompt_tokens).toBe(0);
    expect(result?.completion_tokens).toBe(0);
  });

  it('should prefer standard naming over alternatives', () => {
    const data = {
      usage: {
        prompt_tokens: 100,
        input_tokens: 200,
        completion_tokens: 50,
        output_tokens: 75
      }
    };
    const result = extractUsage(data);
    expect(result?.prompt_tokens).toBe(100);
    expect(result?.completion_tokens).toBe(50);
  });
});

describe('parseResponse', () => {
  it('should return content, usage, and raw data', () => {
    const data = {
      choices: [{ message: { content: 'Test' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 }
    };
    const result = parseResponse(data);
    expect(result.content).toBe('Test');
    expect(result.usage?.prompt_tokens).toBe(10);
    expect(result.usage?.completion_tokens).toBe(5);
    expect(result.raw).toEqual(data);
  });

  it('should handle reasoning_content as fallback', () => {
    const data = {
      choices: [{ message: { content: '', reasoning_content: 'Reasoning' } }]
    };
    const result = parseResponse(data);
    expect(result.content).toBe('Reasoning');
  });
});
