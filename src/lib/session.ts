import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "mapeove-super-secret-key-1234567890-change-in-prod-2026";

export interface SessionUser {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function sign(payload: SessionUser): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verify(token: string): SessionUser | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload;
  } catch (e) {
    return null;
  }
}
