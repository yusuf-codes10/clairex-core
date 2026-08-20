// types

import type { ClaireContext } from "./context";
import type { ClaireMiddleware } from "./middleware";

/**
 * Signature every route handler must satisfy.
 * Receives the request context and must return a Response (sync or async).
 *
 * @example
 * private getUsers(c: ClaireContext): Response {
 *     return c.response.json(users);
 * }
 */
// TODO: might switch the ClaireHandler into a class
export type ClaireHandler = (c: ClaireContext) => Response | Promise<Response>;

/**
 * @internal
 * A single registered route. Stored in ClaireRouter's flat routes array.
 * `middlewares` are key-level, `routeMiddlewares` are route-level — kept separate
 * so the onion model can execute them in the correct order.
 */
export type RouterEntry = {
    method: string,
    pattern: string,
    handler: ClaireHandler,
    middlewares?: ClaireMiddleware[], // key level middleware
    routeMiddlewares?: ClaireMiddleware[] //route level middleware
}

// ClaireValidator Types

/**
 * Validation rules for a single body field.
 *
 * `min` and `max` apply to string length or numeric value depending on `type`.
 * On PATCH requests `required` is ignored (the body is treated as partial), while
 * `type`, `min` and `max` are still enforced on any field that is present.
 *
 * @example
 * { type: 'string', required: true, min: 3, max: 50 }
 * { type: 'number', required: true, min: 18 }
 * { type: 'number', required: true, immutable: true }  // rejected on PATCH
 */
export type ValidationRule = {
  /** Expected runtime type of the value. */
  type: "number" | "string" | "boolean";
  /** Field must be present. Enforced on POST/PUT only — ignored on PATCH. */
  required?: boolean;
  /** Minimum string length, or minimum numeric value. */
  min?: number;
  /** Maximum string length, or maximum numeric value. */
  max?: number;
  /** Field cannot be updated. Sending it on a PATCH request returns 400. */
  immutable?: boolean;
};

/**
 * The shape returned by a ClaireValidator's `rules()` method.
 * Maps each body field name to its validation rules.
 *
 * @example
 * override rules(): ValidationSchema {
 *     return {
 *         id:   { type: 'number', required: true },
 *         name: { type: 'string', required: true, min: 3 }
 *     };
 * }
 */
export type ValidationSchema = Record<string, ValidationRule>;
