/**
 * A rate limiter to control the frequency of API requests.
 */
export class RateLimiter {
    private queue: (() => void)[] = [];
    private running = 0;

    /**
     * Creates a new RateLimiter instance.
     * @param maxConcurrent - The maximum number of concurrent requests allowed.
     * @param interval - The interval in milliseconds between requests.
     */
    constructor(private maxConcurrent: number, private interval: number) {}

    /**
     * Waits for the rate limiter to allow a new request.
     * @returns A promise that resolves when the request can proceed.
     */
    async wait(): Promise<void> {
        if (this.running >= this.maxConcurrent) {
            await new Promise<void>(resolve => this.queue.push(resolve));
        }
        this.running++;
        setTimeout(() => this.release(), this.interval);
    }

    /**
     * Releases a slot in the rate limiter.
     */
    private release(): void {
        this.running--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) next();
        }
    }
}