import { describe, it, expect, vi, afterEach } from 'vitest';
import { withTimeout, TimeoutError } from './withTimeout';

afterEach(() => vi.useRealTimers());

describe('withTimeout', () => {
  it('resolves with the value when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });

  it('passes through the original rejection', async () => {
    const err = new Error('boom');
    await expect(withTimeout(Promise.reject(err), 1000)).rejects.toBe(err);
  });

  it('rejects with TimeoutError when the promise never settles', async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise(() => {}), 500);
    vi.advanceTimersByTime(500);
    await expect(result).rejects.toBeInstanceOf(TimeoutError);
  });
});
