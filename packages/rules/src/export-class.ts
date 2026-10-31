import type { Rule } from "./types";

const ID = "export-class";

export const exportClassRule: Rule = {
    id: ID,
    description: "A .cx file must export a class.",

    check(ts, sf) {
        // `export class A {}` and `export default class A {}` both carry the export keyword.
        const exportsClass = sf.statements.some(
            (statement) =>
                ts.isClassDeclaration(statement) &&
                ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
        );
        if (exportsClass) return [];

        // Underline the first statement (or the very start of an empty file).
        const first = sf.statements[0];
        return [
            {
                rule: ID,
                severity: "error",
                message: ".cx files must export a class.",
                start: first ? first.getStart(sf) : 0,
                length: first ? first.getWidth(sf) : Math.min(1, sf.text.length),
            },
        ];
    },
};