import jwt, { SignOptions } from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export interface JwtPayload {
  id: string;
  role: string;
  sessionId?: string; // Optional for backward compatibility
}

export function signToken(payload: JwtPayload, expires: string | number = "20h"): string {
  const options: SignOptions = { expiresIn: expires as any };
  return jwt.sign(payload, SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
