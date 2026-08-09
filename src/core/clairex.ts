import { ClaireRouter } from "./router";
import { ClaireContext } from "./context";
import { matchRoute } from "./utils";
export class ClaireX extends ClaireRouter {
  private port;

  constructor(port?: number) {
    super();
    this.port = port ?? 3000;
  }

  listen() {
    Bun.serve({
      port: this.port,

      fetch: (req: Request) => {
        const context = new ClaireContext(req);

        for (const route of this.routes) {
          if (route.method !== context.request.method) continue; //skip to next iteration

          const params = matchRoute(route.pattern, context.request.pathname);

          // TODO: we need to set up the params here!
          if (params === null) continue;

          context.request.params = params;

          return route.handler(context);
        }
      },
    });

    console.log(`ClaireX running on ${this.port}`);
  }
}
