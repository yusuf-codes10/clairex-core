import { ClaireContext } from "../core/context";
export abstract class ClaireMiddleware {
  before(ctx: ClaireContext): void | Response | Promise<void | Response> {}
  after(ctx: ClaireContext, response: Response): Response | Promise<Response> {
    return response;
  }
}
