import { ClaireValidator } from "../../src/core/validator";

export class userValidator extends ClaireValidator {
    override rules (){
        return {
            id: {type: 'number'},
            name: {type: 'string'},
            age: {type: 'number'}
        }
    }
}