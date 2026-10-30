import type * as TS from "typescript";
import type { RuleViolation } from "./types";

/** Build a violation that underlines `node` (leading whitespace and comments are skipped). */
export function violationAt(
    sf: TS.SourceFile,
    node: TS.Node,
    rule: string,
    message: string,
    severity: RuleViolation["severity"] = "error",
): RuleViolation {
    return {
        rule,
        message,
        severity,
        start: node.getStart(sf),
        length: node.getWidth(sf),
    };
}