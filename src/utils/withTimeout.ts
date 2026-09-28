export class TimeoutError extends Error {
    constructor(ms: number) {
        super(`Timed out after ${ms}ms`);
        this.name = 'TimeoutError';
    }
}

/**
 * Rejects with TimeoutError if `promise` hasn't settled within `ms`.
 * Firestore calls never reject while the backend is unreachable (reads fall back
 * after ~30s, writes wait forever), so UI-blocking calls need an upper bound.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Like withTimeout, but `promise` is never abandoned: if it goes on to resolve
 * after the timeout already rejected the race, `onLateResolve` still fires with
 * the value. Without this, a write that's merely slow (not actually failed) gets
 * silently dropped by the caller once the timeout wins.
 */
export function withTimeoutRecovery<T>(
    promise: Promise<T>,
    ms: number,
    onLateResolve: (value: T) => void
): Promise<T> {
    promise.then(onLateResolve, () => {});
    return withTimeout(promise, ms);
}
