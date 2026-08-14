export class ClaireResponse {
  private _status: number;

  constructor(status: number = 200) {
    this._status = status;
  }

  /**
   * Returns a JSON response with the given data and status code.
   *
   * @param data - The data to serialize as JSON.
   * @param status - The HTTP status code. Defaults to 200.
   * @returns A native Response with Content-Type: application/json.
   *
   * @example
   * return c.response.json({ message: "Hello" });
   * return c.response.json({ error: "Not found" }, 404);
   */
  json(data: unknown, status: number = 200): Response {
    this._status = status;
    return new Response(JSON.stringify(data), {
      status: this._status,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Returns a plain text response with the given data and status code.
   *
   * @param data - The text content to send.
   * @param status - The HTTP status code. Defaults to 200.
   * @returns A native Response with Content-Type: text/plain.
   *
   * @example
   * return c.response.text("Hello, world!");
   * return c.response.text("Not found", 404);
   */
  text(data: string, status: number = 200): Response {
    this._status = status;
    return new Response(data, {
      status: this._status,
      headers: { "Content-Type": "text/plain" },
    });
  }

  /**
   * Returns an HTML response with the given data and status code.
   *
   * @param data - The HTML content to send.
   * @param status - The HTTP status code. Defaults to 200.
   * @returns A native Response with Content-Type: text/html.
   *
   * @example
   * return c.response.html("<h1>Hello</h1>");
   */
  html(data: string, status: number = 200): Response {
    this._status = status;
    return new Response(data, {
      status: this._status,
      headers: { "Content-Type": "text/html" },
    });
  }

  /**
   * Returns a redirect response to the given URL.
   *
   * @param url - The URL to redirect to.
   * @param status - The redirect status code (301 or 302). Defaults to 302.
   * @returns A native Response with Location header and null body.
   *
   * @example
   * return c.response.redirect("/login");
   * return c.response.redirect("/new-page", 301);
   */
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
