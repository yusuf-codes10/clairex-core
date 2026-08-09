export class ClaireResponse {
  private _status: number;

  constructor(status: number = 200) {
    this._status = status;
  }

  json(data: unknown, status: number = 200): Response {
    this._status = status;
    return new Response(JSON.stringify(data), {
      status: this._status,
      headers: { "Content-Type": "application/json" },
    });
  }

  text(data: string, status: number = 200): Response {
    this._status = status;
    return new Response(data, {
      status: this._status,
      headers: { "Content-Type": "text/plain" },
    });
  }

  html(data: string, status: number = 200): Response {
    this._status = status;
    return new Response(data, {
      status: this._status,
      headers: { "Content-Type": "text/html" },
    });
  }

  redirect(url: string, status: 301 | 302 = 302): Response {
    this._status = status;
    return new Response(null, {
      status: this._status,
      headers: {
        Location: url,
      },
    });
  }

  get status (): number {
    return this._status;
  }
}
