export class ClaireResponse {
  private status: number;

  constructor(status: number = 200) {
    this.status = status;
  }

  json(data: unknown, status: number = 200) {
    this.status = status;
    return new Response(JSON.stringify(data), {
      status: this.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  text(data: string, status: number = 200) {
    this.status = status;
    return new Response(data, {
      status: this.status,
      headers: { "Content-Type": "text/plain" },
    });
  }

  html(data: string, status: number = 200) {
    this.status = status;
    return new Response(data, {
      status: this.status,
      headers: { "Content-Type": "text/html" },
    });
  }

  redirect(url: string, status: 301 | 302 = 302) {
    this.status = status;
    return new Response(null, {
      status: this.status,
      headers: {
        Location: url,
      },
    });
  }
}
