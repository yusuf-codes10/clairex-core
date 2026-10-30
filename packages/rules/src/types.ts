import type * as TS from "typescript";

/** The TypeScript module itself. Callers pass it in, so this package never imports typescript at runtime. */
export type TSModule = typeof TS;

/** What a rule reports: where the problem is and what it is. */
export interface RuleViolation {
    /** Id of the rule that found it, e.g. "return-type". */
    rule: string;
    message: string;
    severity: "error" | "warning";
    /** Character offset in the file where the problem starts. */
    start: number;
    /** How many characters the problem covers (the length of the squiggle). */
    length: number;
}

/** A violation after check() has added a human-readable position. */
export interface Violation extends RuleViolation {
    /** 1-based line number. */
    line: number;
    /** 1-based column number. */
    column: number;
}

export interface Rule {
    id: string;
    description: string;
    check(ts: TSModule, sourceFile: TS.SourceFile): RuleViolation[];
}