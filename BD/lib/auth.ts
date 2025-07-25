// lib/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { withCors } from "./cors"; // Make sure this path is correct relative to lib/auth.ts
import type { User } from "./models/User";

// Ensure JWT_SECRET is loaded
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in environment");
}

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ✅ Generate a JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ✅ Verify a JWT token
export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
}

// ✅ Secure password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ✅ Compare password with hash
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ✅ Create URL-safe slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ✅ Admin-only middleware for API routes (Next.js API Handler or Route Handler)
export async function authenticateRequest(request: NextRequest): Promise<NextResponse | { user: DecodedToken }> {
  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // Or fallback to cookie
  const tokenFromCookie = request.cookies.get("auth-token")?.value;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return withCors(
      NextResponse.json({ error: "No token provided" }, { status: 401 }),
      request // <--- ADDED 'request' HERE
    );
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return withCors(
      NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
      request // <--- ADDED 'request' HERE
    );
  }

  if (decoded.role !== "admin") {
    return withCors(
      NextResponse.json({ error: "Admin access required" }, { status: 403 }),
      request // <--- ADDED 'request' HERE
    );
  }

  // ✅ Return user info if authorized
  return { user: decoded };
}

// Export all utilities
export default {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateSlug,
  authenticateRequest
};