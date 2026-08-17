export class ClaireRequest {
  private raw: Request;
  private _params: Record<string, string>;
  private _method: string;
  private _url: URL;

  constructor(req: Request, params: Record<string, string> = {}) {
    this.raw = req;
    this._params = params;
    this._url = new URL(req.url);
    this._method = req.method;
  }

  /**
   * Parses and returns the request body as JSON.
   * Returns `unknown` — use ClaireValidator to get typed data via `c.valid<T>()`.
   *
   * @returns The parsed JSON body.
   *
   * @example
   * const body = await c.request.json();
   */
  async json(): Promise<unknown> {
    return await this.raw.json();
  }

  /**
   * Returns the request body as a plain text string.
   *
   * @returns The raw body text.
   *
   * @example
   * const body = await c.request.text();
   */
  async text(): Promise<string> {
    return await this.raw.text();
  }

  /**
   * Returns the URL query parameters as a single-value object.
   * If a key appears multiple times, only the last value is kept.
   *
   * @returns The query parameters as key-value pairs.
   *
   * @example
   * // URL: /users?page=1&limit=10
   * c.request.query // { page: "1", limit: "10" }
   */
  get query(): Record<string, string> {
    return Object.fromEntries(this._url.searchParams);
  }

  /**
   * Returns the URL query parameters as a multi-value object.
   * Preserves all values for repeated keys.
   *
   * @returns The query parameters with arrays of values per key.
   *
   * @example
   * // URL: /users?tag=admin&tag=editor
   * c.request.queries // { tag: ["admin", "editor"] }
   */
  get queries(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const key of this._url.searchParams.keys()) {
      result[key] = this._url.searchParams.getAll(key);
    }
    return result;
  }

  get url(): URL {
    return this._url;
  }

  get pathname(): string {
    return this._url.pathname;
  }

  get method(): string {
    return this._method;
  }

  // get params (): Record <string, string> {
  //   return this._params;
  // }

  /**
   * Provides access to request headers via helper methods.
   * Uses the native Headers API — keys are case-insensitive.
   *
   * @returns An object with get(), has(), and all() methods.
   *
   * @example
   * const token = c.request.headers.get('authorization');
   * const hasAuth = c.request.headers.has('authorization');
   * const allHeaders = c.request.headers.all();
   */
  get headers() {
    // return Object.fromEntries(this.raw.headers);
    return {
      get: (key: string) => this.raw.headers.get(key),
      has: (key: string) => this.raw.headers.has(key),
      all: () => Object.fromEntries(this.raw.headers),
    };
  }

  get params(): Record<string, string> {
    return this._params;
  }
}
