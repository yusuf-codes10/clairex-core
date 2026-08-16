export const matchRoute = (
  route: string,
  path: string,
): Record<string, string> | null => {
  const routeParts: string[] = route.split("/").filter(Boolean);
  const pathParts: string[] = path.split("/").filter(Boolean);

  if (routeParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i: number = 0; i < routeParts.length; i++) {
    const routePart: string | undefined = routeParts[i];
    const pathPart: string | undefined = pathParts[i];

    if (!routePart || !pathPart) return null;

    if (routePart.startsWith(":")) {
      params[routePart.slice(1)] = pathPart;
      continue;
    }

    if (routePart !== pathPart) {
      return null;
    }
  }

  return params;
};

export const clairexBanner = (port: number): void => {
  const purple: string = "\x1b[38;2;100;60;220m";
  const dim: string = "\x1b[2m";
  const reset: string = "\x1b[0m";

  const banner: string = `
${purple}   ╔═══════════════════════════════════════════════════════════════════╗
   ║                                                                   ║
   ║    ██████╗ ██╗      █████╗ ██╗██████╗ ███████╗██╗  ██╗           ║
   ║   ██╔════╝ ██║     ██╔══██╗██║██╔══██╗██╔════╝╚██╗██╔╝           ║
   ║   ██║      ██║     ███████║██║██████╔╝█████╗   ╚███╔╝            ║
   ║   ██║      ██║     ██╔══██║██║██╔══██╗██╔══╝   ██╔██╗            ║
   ║   ╚██████╗ ███████╗██║  ██║██║██║  ██║███████╗██╔╝ ██╗           ║
   ║    ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝           ║
   ║                                                                   ║
   ╚═══════════════════════════════════════════════════════════════════╝${reset}

${dim}   ⚡ ClaireX Framework${reset}
${dim}   ⚡ Running on port ${port}${reset}
${dim}   ⚡ Class-based • Bun-native • Explicitly typed${reset}
`;

  console.log(banner);
};


export const logClaireException = (name: string, statusCode: number, content: string, hint?: string): void => {
  const red: string = "\x1b[38;2;220;50;50m";
  const yellow: string = "\x1b[38;2;220;180;50m";
  const dim: string = "\x1b[2m";
  const reset: string = "\x1b[0m";

  const width: number = 56;
  const header: string = `${name} [${statusCode}]`;
  const headerPad: string = header.padEnd(width - 2);
  const contentPad: string = content.padEnd(width - 2);

  let output: string = `
${red}   ╔${"═".repeat(width)}╗
   ║  ${headerPad}║
   ╠${"═".repeat(width)}╣
   ║  ${contentPad}║
   ║${" ".repeat(width)}║`;

  if (hint) {
    const hintPad: string = `Hint: ${hint}`.padEnd(width - 2);
    output += `
${yellow}   ║  ${hintPad}${red}║`;
  }

  output += `
   ╚${"═".repeat(width)}╝${reset}`;

  console.log(output);
};


export const colorMethod = (method: string): string => {
  const reset: string = "\x1b[0m";
  const bold: string = "\x1b[1m";

  const colors: Record<string, string> = {
    GET: "\x1b[38;2;80;200;120m",     // green
    POST: "\x1b[38;2;60;140;230m",    // blue
    PUT: "\x1b[38;2;220;180;50m",     // yellow
    PATCH: "\x1b[38;2;180;130;220m",  // purple
    DELETE: "\x1b[38;2;220;70;70m",   // red
  };

  const color: string = colors[method] ?? "\x1b[37m";
  return `${bold}${color}${method}${reset}`;
};


// ─── JWT Utilities (zero external dependencies) ───────────────────────────────

/**
 * Base64url encodes a string or Uint8Array.
 */
const base64urlEncode = (data: string | Uint8Array): string => {
  const str: string = typeof data === 'string'
    ? btoa(data)
    : btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Base64url decodes a string to raw bytes.
 */
const base64urlDecode = (str: string): Uint8Array => {
  const padded: string = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary: string = atob(padded);
  const bytes: Uint8Array = new Uint8Array(binary.length);
  for (let i: number = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Creates the HMAC-SHA256 signing key from a secret string.
 */
const createSigningKey = async (secret: string): Promise<CryptoKey> => {
  const encoder: TextEncoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
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
export const signToken = async (
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number = 3600
): Promise<string> => {
  const header: Record<string, string> = { alg: 'HS256', typ: 'JWT' };
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
    'HMAC',
    key,
    encoder.encode(signingInput)
  );

  const encodedSignature: string = base64urlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
};