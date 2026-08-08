import { ClaireRouter } from "./router";
export class ClaireX extends ClaireRouter  {
    private port;

    constructor (port: number = 3000) {
        super();
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