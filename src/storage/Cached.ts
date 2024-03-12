/**
 * Create a cached version of a pure function.
 */
export function cached<R>(fn: (str: string) => R): (sr: string) => R {
    const cache: Record<string, R> = Object.create(null);
    return function cachedFn(str: string) {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
    };
}
