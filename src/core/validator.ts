import type { ClaireContext } from "./context";
import { ClaireException } from "./exception";
import { ClaireMiddleware } from "./middleware";
import type { ValidationRule, ValidationSchema } from "./types";

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
    const method: string = c.request.method.toUpperCase();

    if (
      method === "GET" ||
      method === "DELETE" ||
      method === "HEAD" ||
      method === "OPTIONS"
    )
      return;

    const isPartial: boolean = method === "PATCH";
    const schema: ValidationSchema = isPartial
      ? this.partial(this.rules())
      : this.rules();

    const body = (await c.request.json()) as Record<string, unknown>;

    const validated: Record<string, unknown> = {};

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

      // all checks passed — keep this field
      if (value !== undefined) validated[key] = value;
    }
    // empty the patch guard
    if (isPartial && Object.keys(validated).length === 0) {
      return new ClaireException(
        400,
        "Validation failed!: at least one field is required",
      ).toResponse();
    }

    //   store validated body somewhere
    c.partial = isPartial;
    c.body = validated;
  }

  protected partial(schema: ValidationSchema): ValidationSchema {
    const result: ValidationSchema = {};
    for (const key in schema) {
      const rule = schema[key];

      if (rule) result[key] = { ...rule, required: false };
    }
    return result;
  }
}
