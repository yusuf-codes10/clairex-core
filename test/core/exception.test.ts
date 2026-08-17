import { test, expect, describe } from "bun:test";
import { ClaireException } from "../../src/core/exception";

describe("ClaireException", () => {
  test("extends Error", () => {
    const ex = new ClaireException(404, "Not found");
    expect(ex).toBeInstanceOf(Error);
  });

  test("sets name to ClaireException", () => {
    const ex = new ClaireException(400, "Bad request");
    expect(ex.name).toBe("ClaireException");
  });

  test("stores statusCode correctly", () => {
    const ex = new ClaireException(401, "Unauthorized");
    expect(ex.statusCode).toBe(401);
  });

  test("stores content correctly", () => {
    const ex = new ClaireException(500, "Server error");
    expect(ex.content).toBe("Server error");
  });

  test("stores metadata when provided", () => {
    const meta = { field: "email", reason: "invalid" };
    const ex = new ClaireException(400, "Validation failed", meta);
    expect(ex.metadata).toEqual(meta);
  });

  test("metadata is undefined when not provided", () => {
    const ex = new ClaireException(404, "Not found");
    expect(ex.metadata).toBeUndefined();
  });

  test("message is set on Error via super()", () => {
    const ex = new ClaireException(404, "User not found");
    expect(ex.message).toBe("User not found");
  });

  describe("toResponse()", () => {
    test("returns a Response object", () => {
      const ex = new ClaireException(404, "Not found");
      const res = ex.toResponse();
      expect(res).toBeInstanceOf(Response);
    });

    test("response has correct status code", () => {
      const ex = new ClaireException(400, "Bad request");
      const res = ex.toResponse();
      expect(res.status).toBe(400);
    });

    test("response has JSON content-type header", () => {
      const ex = new ClaireException(500, "Error");
      const res = ex.toResponse();
      expect(res.headers.get("content-type")).toBe("application/json");
    });

    test("response body contains exception content", async () => {
      const ex = new ClaireException(404, "User not found");
      const res = ex.toResponse();
      const body = await res.json();
      expect(body).toEqual({ exception: "User not found" });
    });

    test("different status codes produce different responses", () => {
      const ex401 = new ClaireException(401, "Unauthorized").toResponse();
      const ex403 = new ClaireException(403, "Forbidden").toResponse();
      expect(ex401.status).toBe(401);
      expect(ex403.status).toBe(403);
    });
  });
});
