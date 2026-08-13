import { describe, expect, it } from 'vitest';
import { SettingsMemoryQueue } from '../../src/core/settings-memory-queue';

describe('settings memory competition handling', () => {
  it('serializes interleaved writers and lets reads wait for every earlier write', async () => {
    const queue = new SettingsMemoryQueue();
    const trace: string[] = [];
    const writes = Array.from({ length: 200 }, (_, index) =>
      queue.enqueue(async () => {
        trace.push(`start:${index}`);
        await Promise.resolve();
        trace.push(`end:${index}`);
        return index;
      }),
    );
    const read = queue.afterWrites(() => {
      trace.push('read');
      return Promise.resolve(trace.length);
    });

    await Promise.all(writes);
    await read;
    expect(trace.at(-1)).toBe('read');
    for (let index = 0; index < 200; index += 1) {
      expect(trace[index * 2]).toBe(`start:${index}`);
      expect(trace[index * 2 + 1]).toBe(`end:${index}`);
    }
  });

  it('continues processing after a rejected write without reordering later writes', async () => {
    const queue = new SettingsMemoryQueue();
    const trace: string[] = [];
    const first = queue.enqueue(() => {
      trace.push('first');
      return Promise.reject(new Error('conflict'));
    });
    const second = queue.enqueue(() => {
      trace.push('second');
      return Promise.resolve('ok');
    });

    await expect(first).rejects.toThrow('conflict');
    await expect(second).resolves.toBe('ok');
    expect(trace).toEqual(['first', 'second']);
  });
});
