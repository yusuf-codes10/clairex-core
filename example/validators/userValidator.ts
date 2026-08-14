import { ClaireValidator } from "../../src/core/validator";
import type { ValidationSchema } from '../../src/core/types'

export class userValidator extends ClaireValidator {
    override rules(): ValidationSchema{
        return {
            id: {type: 'number', required: true},
            name: {type: 'string', required: true},
            age: {type: 'number', required: true}
        }
    }
}