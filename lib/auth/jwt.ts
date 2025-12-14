import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export interface JwtPayload {
  id: string;
  role: string;
}

export function signToken(payload: JwtPayload, expires = "1d") {
  return jwt.sign(payload, SECRET, { expiresIn: expires });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
