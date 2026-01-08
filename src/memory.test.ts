import { memory, reset } from './memory';
import { describe, it, expect } from 'bun:test';

describe('memory', () => {
  it('starts with empty state', () => {
    reset();
    expect(memory.task).toBe('');
    expect(memory.steps).toEqual([]);
    expect(memory.results).toEqual([]);
  });

  it('stores task and accumulates steps/results', () => {
    reset();
    memory.task = 'test goal';
    memory.steps.push('step 1');
    memory.results.push('result 1');

    expect(memory.task).toBe('test goal');
    expect(memory.steps).toEqual(['step 1']);
    expect(memory.results).toEqual(['result 1']);
  });

  it('reset clears all data', () => {
    memory.task = 'persistent';
    memory.steps.push('x');
    memory.results.push('y');

    reset();

    expect(memory.task).toBe('');
    expect(memory.steps).toEqual([]);
    expect(memory.results).toEqual([]);
  });
});
