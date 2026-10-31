import type * as TS from "typescript";
import { violationAt } from "../helpers";
import type { Rule, RuleViolation } from "../types";

const ID = "return-type";

export const returnTypeRule: Rule = {
    id: ID,
    description: "Methods and functions must declare an explicit return type.",

    check(ts, sf) {
        const found: RuleViolation[] = [];

        const visit = (node: TS.Node): void => {
            // Only declarations that have a body: overload signatures and abstract
            // methods have nothing to infer. Constructors and arrow functions
            // (callbacks like users.find((u) => ...)) are different node kinds,
            // so they are not flagged.
            if (
                (ts.isMethodDeclaration(node) || ts.isFunctionDeclaration(node)) &&
                node.body &&
                !node.type
            ) {
                const kind = ts.isMethodDeclaration(node) ? "Method" : "Function";
                const name = node.name?.getText(sf) ?? "(anonymous)";
                found.push(
                    violationAt(
                        sf,
                        node.name ?? node,
                        ID,
                        `${kind} "${name}" is missing a return type.`,
                    ),
                );
            }
            ts.forEachChild(node, visit);
        };

        visit(sf);
        return found;
    },
};