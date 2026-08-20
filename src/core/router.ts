import type { RouterEntry, ClaireHandler } from "./types";

/**
 * @internal
 * Route storage. Used internally by ClaireX (for the matched route table) and by
 * ClaireKey (for per-resource registration).
 *
 * Not part of the public API — define routes with `this.routes()` inside a ClaireKey.
 */
export class ClaireRouter {
  protected _routes: RouterEntry[] = [];

  private register(method: string, path: string, handler: ClaireHandler): void {
    this._routes.push({ method, pattern: path, handler });
  }

  get(path: string, handler: ClaireHandler): void {
    this.register("GET", path, handler);
  }

  post(path: string, handler: ClaireHandler): void {
    this.register("POST", path, handler);
  }

  patch(path: string, handler: ClaireHandler): void {
    this.register("PATCH", path, handler);
  }

  put(path: string, handler: ClaireHandler): void {
    this.register("PUT", path, handler);
  }

  delete(path: string, handler: ClaireHandler): void {
    this.register("DELETE", path, handler);
  }

  /**
   * @internal
   * Exposes the flat array of registered routes.
   */
  get routes(): RouterEntry[] {
    return this._routes;
  }
}
