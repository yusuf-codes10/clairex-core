import type * as TS from "typescript";
import { violationAt } from "../helpers";
import type { Rule, RuleViolation } from "../types";

const ID = "route-needs-validator";

/** The context methods that read a validated body. Both need a ClaireValidator to have run first. */
const BODY_ACCESSORS = new Set(["valid", "patched"]);

type Handler = TS.MethodDeclaration | TS.ArrowFunction | TS.FunctionExpression;

/**
 * Warns when a route handler reads the validated body (c.valid<T>() / c.patched<T>())
 * but the route registers no ClaireValidator middleware.
 *
 *   this.routes("post", "/", this.createUser);                          // warns
 *   this.routes("post", "/", this.createUser, [new userValidator()]);   // fine
 *
 * Editor-only (runtime: false): ClaireContext already throws a 500 at runtime, and
 * the "is it really a validator?" check needs the type checker, which only the
 * editor has. The rule never guesses: when it can't tell, it stays silent.
 */
export const routeNeedsValidatorRule: Rule = {
    id: ID,
    description:
        "A route whose handler reads c.valid<T>() or c.patched<T>() must have a ClaireValidator middleware.",
    runtime: false,

    check(ts, sf, ctx) {
        const found: RuleViolation[] = [];
        const checker = ctx.checker;

        /** this.routes(...) */
        const isRoutesCall = (node: TS.Node): node is TS.CallExpression =>
            ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            node.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
            node.expression.name.text === "routes";

        /** Is this type ClaireValidator, or a class that extends it (directly or further up)? */
        const extendsValidator = (type: TS.Type, seen: Set<TS.Type>): boolean => {
            if (seen.has(type)) return false;
            seen.add(type);
            if (type.symbol?.name === "ClaireValidator") return true;
            // Generic classes are references to their declared type, which holds the base types.
            const declared = (type as TS.TypeReference).target ?? type;
            return (declared.getBaseTypes() ?? []).some((base) => extendsValidator(base, seen));
        };

        /** False only when we are sure this middleware is NOT a ClaireValidator. */
        const mayBeValidator = (element: TS.Expression): boolean => {
            if (!checker || ts.isSpreadElement(element)) return true;
            const type = checker.getTypeAtLocation(element);
            if (type.flags & ts.TypeFlags.Any) return true; // unresolved import: do not guess
            return extendsValidator(type, new Set());
        };

        /** Could this middleware argument contain a ClaireValidator? */
        const mayHaveValidator = (arg: TS.Expression | undefined): boolean => {
            if (!arg) return false; // no middleware list at all
            if (!ts.isArrayLiteralExpression(arg)) return true; // a variable or a call: cannot tell
            return arg.elements.some((element) => mayBeValidator(element)); // empty list -> false
        };

        /** `this.createUser` -> that method of the class; `(c) => ...` -> itself. */
        const resolveHandler = (
            arg: TS.Expression,
            methods: Map<string, TS.MethodDeclaration>,
        ): Handler | undefined => {
            if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) return arg;
            if (
                ts.isPropertyAccessExpression(arg) &&
                arg.expression.kind === ts.SyntaxKind.ThisKeyword
            ) {
                return methods.get(arg.name.text);
            }
            return undefined;
        };

        /** Finds `<ctx>.valid(...)` or `<ctx>.patched(...)`, where <ctx> is the handler's first parameter. */
        const findBodyAccessor = (
            handler: Handler,
        ): { ctxName: string; accessor: string } | undefined => {
            const first = handler.parameters[0];
            if (!first || !ts.isIdentifier(first.name) || !handler.body) return undefined;
            const ctxName = first.name.text;

            let hit: { ctxName: string; accessor: string } | undefined;
            const visit = (node: TS.Node): void => {
                if (hit) return;
                if (
                    ts.isCallExpression(node) &&
                    ts.isPropertyAccessExpression(node.expression) &&
                    ts.isIdentifier(node.expression.expression) &&
                    node.expression.expression.text === ctxName &&
                    BODY_ACCESSORS.has(node.expression.name.text)
                ) {
                    hit = { ctxName, accessor: node.expression.name.text };
                    return;
                }
                ts.forEachChild(node, visit);
            };
            visit(handler.body);
            return hit;
        };

        const inspectRoute = (
            call: TS.CallExpression,
            methods: Map<string, TS.MethodDeclaration>,
        ): void => {
            // this.routes(httpMethod, path, handler, [middlewares])
            const [, , handlerArg, middlewareArg] = call.arguments;
            if (!handlerArg) return;

            const handler = resolveHandler(handlerArg, methods);
            const hit = handler && findBodyAccessor(handler);
            if (!hit) return;
            if (mayHaveValidator(middlewareArg)) return;

            found.push(
                violationAt(
                    sf,
                    handlerArg,
                    ID,
                    `This handler calls ${hit.ctxName}.${hit.accessor}<T>() but the route has no ClaireValidator middleware, so it will respond with a 500.`,
                    "warning",
                ),
            );
        };

        const inspectClass = (cls: TS.ClassLikeDeclaration): void => {
            const methods = new Map<string, TS.MethodDeclaration>();
            for (const member of cls.members) {
                if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
                    methods.set(member.name.text, member);
                }
            }

            const visit = (node: TS.Node): void => {
                if (ts.isClassLike(node)) return; // nested classes are inspected on their own
                if (isRoutesCall(node)) inspectRoute(node, methods);
                ts.forEachChild(node, visit);
            };
            cls.members.forEach((member) => visit(member));
        };

        const walk = (node: TS.Node): void => {
            if (ts.isClassLike(node)) inspectClass(node);
            ts.forEachChild(node, walk);
        };
        walk(sf);

        return found;
    },
};