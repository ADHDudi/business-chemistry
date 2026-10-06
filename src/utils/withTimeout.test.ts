import { describe, it, expect, vi, afterEach } from 'vitest';
import { withTimeout, withTimeoutRecovery, TimeoutError } from './withTimeout';

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

// JUS-437: a slow-but-successful write must not be silently lost just
// because it crossed the timeout — the caller needs a chance to recover it.
describe('withTimeoutRecovery', () => {
  it('resolves with the value when the promise settles in time, and calls onLateResolve', async () => {
    const onLateResolve = vi.fn();
    await expect(withTimeoutRecovery(Promise.resolve(42), 1000, onLateResolve)).resolves.toBe(42);
    await Promise.resolve(); // flush the .then queued on the same promise
    expect(onLateResolve).toHaveBeenCalledWith(42);
  });

  it('passes through the original rejection without calling onLateResolve', async () => {
    const err = new Error('boom');
    const onLateResolve = vi.fn();
    await expect(withTimeoutRecovery(Promise.reject(err), 1000, onLateResolve)).rejects.toBe(err);
    expect(onLateResolve).not.toHaveBeenCalled();
  });

  it('rejects with TimeoutError when slow, then still calls onLateResolve once the promise resolves late', async () => {
    vi.useFakeTimers();
    const onLateResolve = vi.fn();
    let resolveSave: (id: string) => void;
    const save = new Promise<string>(resolve => { resolveSave = resolve; });

    const result = withTimeoutRecovery(save, 10000, onLateResolve);
    vi.advanceTimersByTime(10000);
    await expect(result).rejects.toBeInstanceOf(TimeoutError);
    expect(onLateResolve).not.toHaveBeenCalled();

    resolveSave!('doc-42');
    await vi.advanceTimersByTimeAsync(0);
    expect(onLateResolve).toHaveBeenCalledWith('doc-42');
  });

  it('does not call onLateResolve if the promise rejects after the timeout has already fired', async () => {
    vi.useFakeTimers();
    const onLateResolve = vi.fn();
    let rejectSave: (err: Error) => void;
    const save = new Promise<string>((_, reject) => { rejectSave = reject; });

    const result = withTimeoutRecovery(save, 10000, onLateResolve);
    vi.advanceTimersByTime(10000);
    await expect(result).rejects.toBeInstanceOf(TimeoutError);

    rejectSave!(new Error('backend unreachable'));
    await vi.advanceTimersByTimeAsync(0);
    expect(onLateResolve).not.toHaveBeenCalled();
  });
});
