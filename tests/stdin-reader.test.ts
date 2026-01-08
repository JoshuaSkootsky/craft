import { describe, it, expect } from 'bun:test';

describe('TextDecoder', () => {
  it('should correctly decode ASCII text', () => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const original = 'Hello, World!';
    const encoded = encoder.encode(original);
    const decoded = decoder.decode(encoded);

    expect(decoded).toBe(original);
  });

  it('should correctly decode UTF-8 text', () => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const original = 'Hello, 世界! 🌍';
    const encoded = encoder.encode(original);
    const decoded = decoder.decode(encoded);

    expect(decoded).toBe(original);
  });

  it('should handle empty Uint8Array', () => {
    const decoder = new TextDecoder();
    const decoded = decoder.decode(new Uint8Array());

    expect(decoded).toBe('');
  });

  it('should handle Uint8Array with only newlines', () => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const original = '\n\n\n';
    const encoded = encoder.encode(original);
    const decoded = decoder.decode(encoded).trimEnd();

    expect(decoded).toBe('');
  });

  it('should decode numbers as strings', () => {
    const decoder = new TextDecoder();
    const encoded = new Uint8Array([72, 101, 108, 108, 111]);
    const decoded = decoder.decode(encoded);

    expect(decoded).toBe('Hello');
  });
});

describe('TextEncoder', () => {
  it('should encode ASCII text', () => {
    const encoder = new TextEncoder();

    const original = 'Hello';
    const encoded = encoder.encode(original);

    expect(encoded.length).toBe(5);
    expect(encoded[0]).toBe(72);
    expect(encoded[4]).toBe(111);
  });

  it('should encode UTF-8 text', () => {
    const encoder = new TextEncoder();

    const original = '世界';
    const encoded = encoder.encode(original);

    expect(encoded.length).toBe(6);
  });

  it('should encode with newline', () => {
    const encoder = new TextEncoder();

    const original = 'hello\n';
    const encoded = encoder.encode(original);

    expect(encoded[encoded.length - 1]).toBe(10);
  });
});

describe('trimEnd', () => {
  it('should trim trailing whitespace', () => {
    expect('hello   '.trimEnd()).toBe('hello');
    expect('hello\t\n'.trimEnd()).toBe('hello');
    expect('  hello  '.trimEnd()).toBe('  hello');
  });

  it('should not trim leading whitespace', () => {
    expect('  hello'.trimEnd()).toBe('  hello');
    expect('\thello\t'.trimEnd()).toBe('\thello');
  });

  it('should handle empty string', () => {
    expect(''.trimEnd()).toBe('');
  });

  it('should handle string with no trailing whitespace', () => {
    expect('hello world'.trimEnd()).toBe('hello world');
  });
});

describe('iterator pattern', () => {
  it('should handle result with value', async () => {
    const encoder = new TextEncoder();
    const mockValue = encoder.encode('test input\n');

    const result = { done: false, value: mockValue };

    const decoder = new TextDecoder();
    const line = result.value ? decoder.decode(result.value).trimEnd() : '';

    expect(line).toBe('test input');
  });

  it('should handle result without value', async () => {
    const result = { done: false, value: undefined as Uint8Array | undefined };

    const decoder = new TextDecoder();
    const line = result.value ? decoder.decode(result.value).trimEnd() : '';

    expect(line).toBe('');
  });

  it('should handle done result', async () => {
    const result = { done: true, value: new Uint8Array() };

    const decoder = new TextDecoder();
    const line = result.value ? decoder.decode(result.value).trimEnd() : '';

    expect(line).toBe('');
  });

  it('should handle iterator with return method', async () => {
    let returnCalled = false;

    const mockIterator = {
      next: async () => ({ done: false, value: new TextEncoder().encode('input') }),
      return: async () => { returnCalled = true; },
    };

    await mockIterator.next();
    await mockIterator.return?.();

    expect(returnCalled).toBe(true);
  });

  it('should handle iterator without return method', async () => {
    const mockIterator: { next: () => Promise<{ done: boolean; value: Uint8Array }>; return?: () => Promise<void> } = {
      next: async () => ({ done: false, value: new Uint8Array() }),
    };

    await mockIterator.next();
    await mockIterator.return?.();

    expect(true).toBe(true);
  });
});

describe('readMoreInput logic extraction', () => {
  function extractLine(data: Uint8Array | undefined): string {
    const decoder = new TextDecoder();
    const line = data ? decoder.decode(data).trimEnd() : '';
    return line;
  }

  it('should extract line from defined Uint8Array', () => {
    const encoder = new TextEncoder();
    const input = encoder.encode('hello world\n');

    const result = extractLine(input);

    expect(result).toBe('hello world');
  });

  it('should return empty string for undefined', () => {
    const result = extractLine(undefined);

    expect(result).toBe('');
  });

  it('should return empty string for empty Uint8Array', () => {
    const result = extractLine(new Uint8Array());

    expect(result).toBe('');
  });

  it('should handle input without newline', () => {
    const encoder = new TextEncoder();
    const input = encoder.encode('hello world');

    const result = extractLine(input);

    expect(result).toBe('hello world');
  });
});
