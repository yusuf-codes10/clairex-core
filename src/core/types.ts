// types

import type { ClaireContext } from "./context";
import { ClaireMiddleware } from "./middleware";

export type ClaireHandler = (c: ClaireContext) => Response | Promise<Response>;

export type RouterEntry = {
    method: string,
    pattern: string,
    handler: ClaireHandler,
    middlewares?: ClaireMiddleware[], // controller level middleware
    routeMiddlewares?: ClaireMiddleware[] //route level middleware
}

// ClaireValidator Types
export type ValidationRule = {
  type: "number" | "string" | "boolean";
  required?: boolean;
  min?: number;
  max?: number;
};

export type ValidationSchema = Record<string, ValidationRule>;