function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "apex-classroom-erp-secret-key-32-bytes!!") {
      throw new Error("SECURITY_VIOLATION: Insecure or missing JWT_SECRET in production");
    }
  }
  return secret || "apex-classroom-erp-secret-key-32-bytes!!";
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getJwtSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signJwt(payload: Record<string, any>, expiresInSeconds = 86400): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await getKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );

  const signature = Buffer.from(signatureBuffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

export async function verifyJwt<T = Record<string, any>>(token: string): Promise<T | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    let base64Sig = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Sig.length % 4) {
      base64Sig += "=";
    }
    const sigBuffer = Buffer.from(base64Sig, "base64");

    const key = await getKey();
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      new TextEncoder().encode(data)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson);

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }

    return payload as T;
  } catch (err) {
    return null;
  }
}
