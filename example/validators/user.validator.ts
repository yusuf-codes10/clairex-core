import type { ValidationSchema } from "../../src";
import { ClaireValidator } from "../../src/core/validator";

export class userValidator extends ClaireValidator {
  override rules(): ValidationSchema {
    return {
      id: { type: "number", required: true },
      name: { type: "string", required: true, min: 3 },
      age: { type: "number", required: true, min: 18 },
    };
  }
}
