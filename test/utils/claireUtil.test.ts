import { test, expect, describe } from "bun:test";
import { ClaireUtil } from "../../src/utils/util";

const TEST_SECRET = "clairex-test-secret-key";

describe("ClaireUtil.signToken", () => {
  test("returns a string with 3 parts separated by dots", async () => {
    const token = await ClaireUtil.signToken({ userId: 1 }, TEST_SECRET);
    const parts = token.split(".");
    expect(parts.length).toBe(3);
  });

  test("produces different tokens for different payloads", async () => {
    const token1 = await ClaireUtil.signToken({ userId: 1 }, TEST_SECRET);
    const token2 = await ClaireUtil.signToken({ userId: 2 }, TEST_SECRET);
    expect(token1).not.toBe(token2);
  });

  test("produces different tokens for different secrets", async () => {
    const token1 = await ClaireUtil.signToken({ userId: 1 }, "secret-a");
    const token2 = await ClaireUtil.signToken({ userId: 1 }, "secret-b");
    expect(token1).not.toBe(token2);
  });
});

describe("ClaireUtil.verifyToken", () => {
  test("verifies a valid token and returns payload", async () => {
    const token = await ClaireUtil.signToken({ userId: 1, role: "admin" }, TEST_SECRET);
    const payload = await ClaireUtil.verifyToken(token, TEST_SECRET);
    expect(payload.userId).toBe(1);
    expect(payload.role).toBe("admin");
  });

  test("payload includes iat and exp", async () => {
    const token = await ClaireUtil.signToken({ userId: 1 }, TEST_SECRET);
    const payload = await ClaireUtil.verifyToken(token, TEST_SECRET);
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(typeof payload.iat).toBe("number");
    expect(typeof payload.exp).toBe("number");
  });

  test("throws on malformed token (not 3 parts)", async () => {
    expect(ClaireUtil.verifyToken("invalid.token", TEST_SECRET)).rejects.toThrow(
      "Malformed JWT: expected 3 parts"
    );
  });

  test("throws on invalid signature (wrong secret)", async () => {
    const token = await ClaireUtil.signToken({ userId: 1 }, TEST_SECRET);
    expect(ClaireUtil.verifyToken(token, "wrong-secret")).rejects.toThrow(
      "Invalid JWT signature"
    );
  });

  test("throws on expired token", async () => {
    // Sign with -1 second expiry (already expired)
    const token = await ClaireUtil.signToken({ userId: 1 }, TEST_SECRET, -1);
    expect(ClaireUtil.verifyToken(token, TEST_SECRET)).rejects.toThrow("JWT expired");
  });

  test("respects custom expiry time", async () => {
    const token = await ClaireUtil.signToken({ userId: 1 }, TEST_SECRET, 7200);
    const payload = await ClaireUtil.verifyToken(token, TEST_SECRET);
    const iat = payload.iat as number;
    const exp = payload.exp as number;
    expect(exp - iat).toBe(7200);
  });
});
