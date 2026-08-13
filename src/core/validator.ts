type ValidationRule = {
    type: number | string | boolean,
    required?: boolean,
    min?: number,
    max?: number
}

export abstract class ClaireValidator {
    abstract rules (): any
}