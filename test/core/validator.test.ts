// tests/core/validator.test.ts
import { test, expect, describe } from "bun:test";
import { ClaireValidator } from "../../src/core/validator";
import { ClaireContext } from "../../src/core/context";
import type { ValidationSchema } from "../../src/core/types";

// A test validator
class TestValidator extends ClaireValidator {
    override rules(): ValidationSchema {
        return {
            name: { type: 'string', required: true, min: 3 },
            age: { type: 'number', required: true, min: 18, max: 100 }
        };
    }
}

// Helper: create a fake Request with JSON body
const fakeRequest = (body: Record<string, unknown>): Request => {
    return new Request("http://localhost/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
};

describe("ClaireValidator", () => {
    const validator = new TestValidator();

    test("passes with valid data", async () => {
        const req = fakeRequest({ name: "Claire", age: 23 });
        const context = new ClaireContext(req, {});
        const result = await validator.before(context);
        // No Response returned = passed
        expect(result).toBeUndefined();
    });

    test("rejects missing required field", async () => {
        const req = fakeRequest({ age: 23 });
        const context = new ClaireContext(req, {});
        const result = await validator.before(context);
        expect(result).toBeInstanceOf(Response);
        expect(result?.status).toBe(400);
    });

    test("rejects wrong type", async () => {
        const req = fakeRequest({ name: 123, age: 23 });
        const context = new ClaireContext(req, {});
        const result = await validator.before(context);
        expect(result).toBeInstanceOf(Response);
        expect(result?.status).toBe(400);
    });

    test("rejects below min (string length)", async () => {
        const req = fakeRequest({ name: "AB", age: 23 });
        const context = new ClaireContext(req, {});
        const result = await validator.before(context);
        expect(result).toBeInstanceOf(Response);
        expect(result?.status).toBe(400);
    });

    test("rejects below min (number value)", async () => {
        const req = fakeRequest({ name: "Claire", age: 10 });
        const context = new ClaireContext(req, {});
        const result = await validator.before(context);
        expect(result).toBeInstanceOf(Response);
        expect(result?.status).toBe(400);
    });

    test("rejects above max (number value)", async () => {
        const req = fakeRequest({ name: "Claire", age: 150 });
        const context = new ClaireContext(req, {});
        const result = await validator.before(context);
        expect(result).toBeInstanceOf(Response);
        expect(result?.status).toBe(400);
    });

    test("stores validated body on context", async () => {
        const req = fakeRequest({ name: "Claire", age: 23 });
        const context = new ClaireContext(req, {});
        await validator.before(context);
        const body = context.valid<{ name: string; age: number }>();
        expect(body.name).toBe("Claire");
        expect(body.age).toBe(23);
    });
});
