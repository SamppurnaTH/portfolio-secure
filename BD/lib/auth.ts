// lib/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { withCors } from "./cors";
import type { User } from "./models/User";

// Ensure JWT_SECRET is loaded and properly typed
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in environment");
}

interface DecodedToken extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// ✅ Generate a JWT token
export function generateToken(user: User): string {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// ✅ Verify a JWT token with proper type checking
export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Type guard to ensure the decoded token matches our interface
    if (typeof decoded === "object" && decoded !== null && 
        "userId" in decoded && "email" in decoded && "role" in decoded) {
      return decoded as DecodedToken;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ✅ Secure password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ✅ Compare password with hash
export async function comparePassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
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

// ✅ Admin-only middleware for API routes
export async function authenticateRequest(
  request: NextRequest
): Promise<NextResponse | { user: DecodedToken }> {
  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : null;

  // Or fallback to cookie
  const tokenFromCookie = request.cookies.get("auth-token")?.value;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return withCors(
      NextResponse.json({ error: "No token provided" }, { status: 401 }),
      request
    );
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return withCors(
      NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
      request
    );
  }

  if (decoded.role !== "admin") {
    return withCors(
      NextResponse.json({ error: "Admin access required" }, { status: 403 }),
      request
    );
  }

  return { user: decoded };
}

// Utility type for authenticated requests
export type AuthenticatedRequest = NextRequest & {
  user: DecodedToken;
};

// Export all utilities
export const authUtils = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateSlug,
  authenticateRequest
};