import type { ClaireContext } from "./context";
import { ClaireMiddleware } from "./middleware";

type ValidationRule = {
  type: number | string | boolean;
  required?: boolean;
  min?: number;
  max?: number;
};

type ValidationSchema = Record<string, ValidationRule>;
export abstract class ClaireValidator extends ClaireMiddleware {
  abstract rules(): ValidationSchema;

  override async before(c: ClaireContext) {

    const body = await c.request.json();
    const schema = this.rules();

    // check body against this.rules()
    // if invalid → throw ValidationException
    // if valid → store typed data somewhere

    for (const key in schema) {
        const rule = schema[key];
        const value = body[key]; // uknown

    }
  }
}
