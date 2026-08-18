import { ClaireValidator } from "../../../src/core/validator";
import type { ValidationSchema } from '../../../src/core/types';

export class updateUserValidator extends ClaireValidator {
    override rules (): ValidationSchema {
        return {
            name: {type: 'string', required: false, min: 3},
            age: {type: 'number', required: false}
        }
    }
}