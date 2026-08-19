import { ClaireValidator } from "../../../src/core/validator";
import type { ValidationSchema } from '../../../src/core/types';

export class userValidator extends ClaireValidator {
    override rules(): ValidationSchema{
        return {
            id: {type: 'number', required: true, max: 200},
            name: {type: 'string', required: true, min: 3},
            age: {type: 'number', required: true}
        }
    }
}