/** An AI provider call failed. `status` is the HTTP status when there was one (401, 429, 503, 408 for timeouts…). */
export class AiScanError extends Error {
  constructor(message: string, public readonly status?: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AiScanError";
  }
}
