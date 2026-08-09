export class ClaireRequest {
  private raw: Request;
  public params: Record<string, string>;
  private _method: string;
  private _url: URL;

  constructor(req: Request, params: Record<string, string> = {}) {
    this.raw = req;
    this.params = params;
    this._url = new URL(req.url);
    this._method = req.method;
  }

  async json(): Promise<unknown> {
    return await this.raw.json();
  }

  async text(): Promise<string> {
    return await this.raw.text();
  }

  get query(): Record<string, string> {
    return Object.fromEntries(this._url.searchParams);
  }

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

  get headers(): Record<string, string> {
    return Object.fromEntries(this.raw.headers);
  }
}
