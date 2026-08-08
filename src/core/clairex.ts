import { ClaireRouter } from "./router";
import { ClaireContext } from "./context";
export class ClaireX extends ClaireRouter  {
    private port;

    constructor (port?: number) {
        super();
        this.port = port ?? 3000;
    }

  listen() {
    Bun.serve({
      port: this.port,

      fetch: (req: Request) => {
        const context = new ClaireContext(req);

        const url = new URL(req.url);

        for (const route of this.routes) {
            if (route.method !== req.method) continue; //skip to next iteration
            return route.handler;
        }

      }
    });

    console.log(`ClaireX running on ${this.port}`);
  }
}