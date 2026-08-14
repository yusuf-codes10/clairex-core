import type { ClaireContext } from "./context";
import { ClaireException } from "./exception";
import { ClaireMiddleware } from "./middleware";
import type { ValidationRule, ValidationSchema } from '../core/types';
export abstract class ClaireValidator extends ClaireMiddleware {
  abstract rules(): ValidationSchema;

  override async before(c: ClaireContext) {
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
