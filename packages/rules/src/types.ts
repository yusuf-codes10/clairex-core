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

/** Extra things a rule may use. Everything here is optional, so a rule must still behave without it. */
export interface RuleContext {
    /**
     * Available in the editor, where the TypeScript server has a full program.
     * Missing when a file is parsed on its own (the Bun loader), so rules must
     * not assume it exists.
     */
    checker?: TS.TypeChecker;
}

export interface Rule {
    id: string;
    description: string;
    /**
     * Does this rule run in the Bun loader at runtime? Defaults to true.
     * Set to false for rules that only make sense in the editor.
     */
    runtime?: boolean;
    check(ts: TSModule, sourceFile: TS.SourceFile, ctx: RuleContext): RuleViolation[];
}