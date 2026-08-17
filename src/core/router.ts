import type { RouterEntry, ClaireHandler } from "./types";

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

  get routes(): RouterEntry[] {
    return this._routes;
  }
}
