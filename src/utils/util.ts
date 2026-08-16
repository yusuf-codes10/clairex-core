import {
  createSigningKey,
  base64urlDecode,
  base64urlEncode,
} from "../core/utils";

/**
 * Static utility class for ClaireX.
 * Provides helper methods for JWT signing, verification, and more.
 *
 * @example
 * const token = await ClaireUtil.signToken({ userId: 1 }, 'secret');
 * const payload = await ClaireUtil.verifyToken(token, 'secret');
 */
export abstract class ClaireUtil {
  /**
   * Verifies a JWT token and returns the decoded payload if valid.
   * Checks signature integrity and expiration.
   *
   * @param token - The JWT string to verify.
   * @param secret - The secret key used to verify the signature.
   * @returns The decoded payload if the token is valid.
   * @throws Error if the token is malformed, signature is invalid, or token is expired.
   *
   * @example
   * const payload = await verifyToken(token, 'my-secret');
   * // payload = { userId: 1, role: 'admin', iat: ..., exp: ... }
   */
  static verifyToken = async (
    token: string,
    secret: string,
  ): Promise<Record<string, unknown>> => {
    const parts: string[] = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Malformed JWT: expected 3 parts");
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts as [
      string,
      string,
      string,
    ];
    const signingInput: string = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const key: CryptoKey = await createSigningKey(secret);
    const encoder: TextEncoder = new TextEncoder();
    const signatureBytes: Uint8Array = base64urlDecode(encodedSignature);

    const isValid: boolean = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer as ArrayBuffer,
      encoder.encode(signingInput),
    );

    if (!isValid) {
      throw new Error("Invalid JWT signature");
    }

    // Decode payload
    const payloadJson: string = new TextDecoder().decode(
      base64urlDecode(encodedPayload),
    );
    const payload: Record<string, unknown> = JSON.parse(payloadJson);

    // Check expiration
    if (
      typeof payload.exp === "number" &&
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      throw new Error("JWT expired");
    }

    return payload;
  };

  /**
   * Signs a JWT and returns the token string.
   * Uses HMAC-SHA256 algorithm via Bun's built-in crypto.subtle.
   *
   * @param payload - The data to encode in the token (e.g., userId, role).
   * @param secret - The secret key used to sign the token.
   * @param expiresInSeconds - Token expiry time in seconds from now. Defaults to 3600 (1 hour).
   * @returns The signed JWT string.
   *
   * @example
   * const token = await signToken({ userId: 1, role: 'admin' }, 'my-secret', 3600);
   */
  static signToken = async (
    payload: Record<string, unknown>,
    secret: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> => {
    const header: Record<string, string> = { alg: "HS256", typ: "JWT" };
    const now: number = Math.floor(Date.now() / 1000);

    const fullPayload: Record<string, unknown> = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodedHeader: string = base64urlEncode(JSON.stringify(header));
    const encodedPayload: string = base64urlEncode(JSON.stringify(fullPayload));
    const signingInput: string = `${encodedHeader}.${encodedPayload}`;

    const key: CryptoKey = await createSigningKey(secret);
    const encoder: TextEncoder = new TextEncoder();
    const signature: ArrayBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signingInput),
    );

    const encodedSignature: string = base64urlEncode(new Uint8Array(signature));
    return `${signingInput}.${encodedSignature}`;
  };
}
