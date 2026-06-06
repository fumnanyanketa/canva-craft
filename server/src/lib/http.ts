/** Shared JSON fetch helper that throws with the response body on non-2xx. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new HttpError(`Request to ${url} failed (${res.status})`, res.status, body);
  }
  return body as T;
}

/** Compact a platform error body into a single string for storage/logging. */
export function describeError(err: unknown): string {
  if (err instanceof HttpError) {
    return `${err.message}: ${JSON.stringify(err.body)}`.slice(0, 1000);
  }
  return err instanceof Error ? err.message : String(err);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
