import type * as TS from "typescript";
import { exportClassRule } from "./rules/export-class";
import { returnTypeRule } from "./rules/return-type";
import type { Rule, TSModule, Violation } from "./types";

export type { Rule, RuleViolation, TSModule, Violation } from "./types";

/** Every rule that runs by default. To add a rule: write it in src/rules/ and list it here. */
export const rules: readonly Rule[] = [exportClassRule, returnTypeRule];

/** Run the rules on an already-parsed file (this is what the editor plugin uses). */
export function check(
    ts: TSModule,
    sf: TS.SourceFile,
    enabled: readonly Rule[] = rules,
): Violation[] {
    return enabled
        .flatMap((rule) => rule.check(ts, sf))
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
    enabled: readonly Rule[] = rules,
): Violation[] {
    const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    return check(ts, sf, enabled);
}

/** "path/to/file.cx:31:11  Method "getUsers" is missing a return type.  (return-type)" */
export function formatViolation(fileName: string, v: Violation): string {
    return `${fileName}:${v.line}:${v.column}  ${v.message}  (${v.rule})`;
}