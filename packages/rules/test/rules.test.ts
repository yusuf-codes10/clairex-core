import { describe, expect, test } from "bun:test";
import ts from "typescript";
import { checkText } from "../src";

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