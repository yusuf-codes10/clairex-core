import type * as TS from "typescript";
import { exportClassRule } from "./rules/export-class";
import { returnTypeRule } from "./rules/return-type";
import { routeNeedsValidatorRule } from "./rules/route-needs-validator";
import type { Rule, TSModule, Violation } from "./types";

export type { Rule, RuleContext, RuleViolation, TSModule, Violation } from "./types";

/** Every rule that runs by default. To add a rule: write it in src/rules/ and list it here. */
export const rules: readonly Rule[] = [exportClassRule, returnTypeRule, routeNeedsValidatorRule];

export interface CheckOptions {
    /**
     * Who is asking. "runtime" (the Bun loader) skips rules marked `runtime: false`.
     * Default is "editor", which runs every rule.
     */
    target?: "editor" | "runtime";
    /** A type checker, when the caller has one (the editor plugin does). */
    checker?: TS.TypeChecker;
    /** Replace the rule list (mostly useful in tests). */
    rules?: readonly Rule[];
}

/** Run the rules on an already-parsed file (this is what the editor plugin uses). */
export function check(ts: TSModule, sf: TS.SourceFile, options: CheckOptions = {}): Violation[] {
    const { target = "editor", checker, rules: list = rules } = options;
    const active = target === "runtime" ? list.filter((rule) => rule.runtime !== false) : list;

    return active
        .flatMap((rule) => rule.check(ts, sf, { checker }))
        .sort((a, b) => a.start - b.start)
        .map((v) => {
            const pos = sf.getLineAndCharacterOfPosition(v.start);
            return { ...v, line: pos.line + 1, column: pos.character + 1 };
        });
}

/** Parse plain text and run the rules on it (this is what the Bun loader uses). */
export function checkText(
    ts: TSModule,
    fileName: string,
    text: string,
    options: CheckOptions = {},
): Violation[] {
    const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    return check(ts, sf, options);
}

/** "path/to/file.cx:31:11  Method "getUsers" is missing a return type.  (return-type)" */
export function formatViolation(fileName: string, v: Violation): string {
    return `${fileName}:${v.line}:${v.column}  ${v.message}  (${v.rule})`;
}