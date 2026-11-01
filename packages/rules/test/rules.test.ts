import { describe, expect, test } from "bun:test";
import ts from "typescript";
import { check, checkText } from "../src";

const run = (code: string) => checkText(ts, "test.cx", code);
const ids = (code: string) => run(code).map((v) => v.rule);

describe("return-type", () => {
    test("flags a method with no return type", () => {
        const found = run(`export class A { getUsers(c: string) { return c; } }`);
        expect(found.map((v) => v.rule)).toEqual(["return-type"]);
        expect(found[0].message).toContain("getUsers");
    });

    test("flags a method with no access modifier", () => {
        expect(ids(`export class A { getUsers(c: string) { return c; } }`)).toContain("return-type");
    });

    test("accepts a method with a return type", () => {
        expect(ids(`export class A { getUsers(c: string): string { return c; } }`)).toEqual([]);
    });

    test("ignores constructors and callbacks", () => {
        const code = `export class A { constructor() {} run(): void { [1].map((n) => n); } }`;
        expect(ids(code)).toEqual([]);
    });
});

describe("export-class", () => {
    test("flags a file with no exported class", () => {
        expect(ids(`const x = 1;`)).toEqual(["export-class"]);
    });

    test("accepts export class and export default class", () => {
        expect(ids(`export class A {}`)).toEqual([]);
        expect(ids(`export default class A {}`)).toEqual([]);
    });
});

// --- route-needs-validator -------------------------------------------------

const ROUTE = "route-needs-validator";
const routeViolations = (code: string, options = {}) =>
    checkText(ts, "keys.cx", code, options).filter((v) => v.rule === ROUTE);

/** A key class with one POST route; `rest` is whatever follows the handler in this.routes(...). */
const keyWith = (rest: string, handlerBody = `const body = c.valid<User>();`) => `
export class UserKey {
  register(): void {
    this.routes("post", "/", this.createUser${rest});
  }
  private createUser(c: Ctx): Response {
    ${handlerBody}
    return c.response.json(body);
  }
}`;

describe("route-needs-validator (no type checker)", () => {
    test("warns when the route has no middleware", () => {
        const found = routeViolations(keyWith(""));
        expect(found).toHaveLength(1);
        expect(found[0].severity).toBe("warning");
        expect(found[0].message).toContain("c.valid");
    });

    test("warns on an empty middleware list", () => {
        expect(routeViolations(keyWith(", []"))).toHaveLength(1);
    });

    test("also covers c.patched()", () => {
        const code = keyWith("", `const body = c.patched<User>();`);
        expect(routeViolations(code)[0].message).toContain("c.patched");
    });

    test("stays quiet when a middleware list is present (it cannot tell what they are)", () => {
        expect(routeViolations(keyWith(", [new userValidator()]"))).toEqual([]);
    });

    test("stays quiet when the middlewares come from a variable", () => {
        expect(routeViolations(keyWith(", middlewares"))).toEqual([]);
    });

    test("stays quiet when the handler never reads the body", () => {
        expect(routeViolations(keyWith("", `const body = {};`))).toEqual([]);
    });

    test("ignores .valid() on something that is not the context parameter", () => {
        expect(routeViolations(keyWith("", `const body = schema.valid();`))).toEqual([]);
    });

    test("checks inline arrow handlers", () => {
        const code = `export class K { register(): void { this.routes("post", "/", (c) => c.valid<User>()); } }`;
        expect(routeViolations(code)).toHaveLength(1);
    });

    test("underlines the handler in the routes(...) call", () => {
        const code = keyWith("");
        const [v] = routeViolations(code);
        expect(code.slice(v.start, v.start + v.length)).toBe("this.createUser");
    });

    test("is skipped for the runtime target, other rules still run", () => {
        expect(routeViolations(keyWith(""), { target: "runtime" })).toEqual([]);
        expect(checkText(ts, "x.cx", `const x = 1;`, { target: "runtime" }).map((v) => v.rule)).toEqual([
            "export-class",
        ]);
    });
});

// A tiny in-memory program, so the rule can use a real type checker.
function withProgram(files: Record<string, string>, entry = "/keys.ts") {
    const all: Record<string, string> = {
        "/lib.d.ts":
            "interface Array<T> {} interface Boolean {} interface Function {} interface IArguments {} interface Number {} interface Object {} interface RegExp {} interface String {}",
        ...files,
    };
    const options: ts.CompilerOptions = {
        noLib: true,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
    };
    const host: ts.CompilerHost = {
        getSourceFile: (f, lang) => (f in all ? ts.createSourceFile(f, all[f], lang, true) : undefined),
        getDefaultLibFileName: () => "/lib.d.ts",
        writeFile: () => {},
        getCurrentDirectory: () => "/",
        getDirectories: () => [],
        getCanonicalFileName: (f) => f,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => "\n",
        fileExists: (f) => f in all,
        readFile: (f) => all[f],
    };
    const program = ts.createProgram([entry], options, host);
    const sf = program.getSourceFile(entry)!;
    return check(ts, sf, { checker: program.getTypeChecker() }).filter((v) => v.rule === ROUTE);
}

const core = `export class ClaireValidator {} export class ClaireJWT {}`;
const validators = `
import { ClaireValidator } from "./core";
export class BaseValidator extends ClaireValidator {}
export class userValidator extends BaseValidator {}`;
const keys = (middlewares: string, imports = "") => `
import { userValidator } from "./validators";
import { ClaireJWT } from "./core";
${imports}
export class UserKey {
  register(): void {
    this.routes("post", "/", this.createUser, ${middlewares});
  }
  private createUser(c: any): void { const body = c.valid(); }
}`;

describe("route-needs-validator (with a type checker)", () => {
    const files = (k: string) => ({ "/core.ts": core, "/validators.ts": validators, "/keys.ts": k });

    test("accepts a class that extends ClaireValidator, even through another class", () => {
        expect(withProgram(files(keys("[new userValidator()]")))).toEqual([]);
    });

    test("warns when the only middleware is not a validator", () => {
        expect(withProgram(files(keys("[new ClaireJWT()]")))).toHaveLength(1);
    });

    test("accepts a list that has a validator among other middleware", () => {
        expect(withProgram(files(keys("[new ClaireJWT(), new userValidator()]")))).toEqual([]);
    });

    test("stays quiet when the middleware type cannot be resolved", () => {
        const k = keys("[new Missing()]", `import { Missing } from "./does-not-exist";`);
        expect(withProgram(files(k))).toEqual([]);
    });
});