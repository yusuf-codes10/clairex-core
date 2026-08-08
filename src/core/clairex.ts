export class ClaireX {
    private port;
    private routes = new Map();

    constructor (port: number = 3000) {
        this.port = port;
    }

  listen() {
    Bun.serve({
      port: this.port,

      fetch: (req: Request) => {
        const url = new URL(req.url);

        const handler = this.routes.get(
            `${req.method}:${url.pathname}`
        );

        if (!handler) {
            return new Response('Not Found', { status: 404});
        }

        return handler;
      }
    });

    console.log(`ClaireX running on ${this.port}`);
  }
}