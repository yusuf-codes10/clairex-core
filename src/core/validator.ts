import type { ClaireContext } from "./context";
import { ClaireException } from "./exception";
import { ClaireMiddleware } from "./middleware";
import type { ValidationRule, ValidationSchema } from '../core/types';

/**
 * Abstract base class for request body validation.
 * Extends ClaireMiddleware — validation runs as a middleware in the before() lifecycle.
 * Extend this class and define rules() to validate incoming request bodies.
 *
 * @example
 * export class UserValidator extends ClaireValidator {
 *     override rules(): ValidationSchema {
 *         return {
 *             name: { type: 'string', required: true, min: 3 },
 *             age: { type: 'number', required: true, min: 18 }
 *         }
 *     }
 * }
 *
 * // Attach as route-level middleware:
 * this.routes('post', '/', this.createUser, [new UserValidator()]);
 *
 * // Access validated data in handler:
 * const body = c.valid<User>();
 */
export abstract class ClaireValidator extends ClaireMiddleware {

    /**
   * Define the validation schema for the request body.
   * Each key represents a field, and its value defines the validation rules.
   *
   * @abstract
   * @returns The validation schema for the expected body shape.
   *
   * @example
   * override rules(): ValidationSchema {
   *     return {
   *         id: { type: 'number', required: true },
   *         name: { type: 'string', required: true, min: 2, max: 50 },
   *         age: { type: 'number', required: true, min: 18 }
   *     }
   * }
   */
  abstract rules(): ValidationSchema;

  override async before(c: ClaireContext): Promise<void | Response> {
    const body = (await c.request.json()) as Record<string, unknown>;
    const schema = this.rules();

    // check body against this.rules()
    // if invalid → throw ValidationException
    // if valid → store typed data somewhere

    for (const key in schema) {
      const rule = schema[key];
      const value = body[key]; // uknown

      // 1. Required Check
      if (rule?.required && (value === undefined || value === null)) {
        // throw filed is missing
        return new ClaireException(
          400,
          `Validation failed!: ${key} is required!`,
        ).toResponse();
      }

      // 2. Type check
      if (value !== undefined && typeof value !== rule?.type) {
        // throw wrong type
        return new ClaireException(
          400,
          `Validation failed! "${key}" must be of type "${rule?.type}"`,
        ).toResponse();
      }

      // 3. min check
      if (rule && rule.min !== undefined && value !== undefined) {
        if (typeof value === "string" && value.length < rule.min) {
          return new ClaireException(
            400,
            `Validation failed!: "${key}" must be at least ${rule.min} characters`,
          ).toResponse();
        }

        if (typeof value === "number" && value < rule.min) {
          return new ClaireException(
            400,
            `Validation failed!: "${key}" must be at least ${rule.min}`,
          ).toResponse();
        }
      }

      // 4. max check
      if (rule && rule.max !== undefined && value !== undefined) {
        if (typeof value === "string" && value.length > rule.max) {
          return new ClaireException(
            400,
            `Validation failed!: "${key}" must be at most ${rule.max} characters`,
          ).toResponse();
        }

        if (typeof value === "number" && value > rule.max) {
          return new ClaireException(
            400,
            `Validation failed!: "${key}" must be at most ${rule.max}`,
          ).toResponse();
        }
      }

    }
    //   store validated body somewhere
    c.body = body;
  }
}
