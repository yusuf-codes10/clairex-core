import { ClaireMiddleware } from "./middleware";

type ValidationRule = {
    type: number | string | boolean,
    required?: boolean,
    min?: number,
    max?: number
}

type ValidationSchema = Record<string, ValidationRule>;
export abstract class ClaireValidator extends ClaireMiddleware {
    abstract rules (): ValidationSchema;

    override before (){
        
    }
}