import { ClaireValidator } from "../../src/core/validator";
import type { ValidationSchema } from '../../src/core/types'

export class userValidator extends ClaireValidator {
    override rules(): ValidationSchema{
        return {
            id: {type: 'number'},
            name: {type: 'string'},
            age: {type: 'number'}
        }
    }
}