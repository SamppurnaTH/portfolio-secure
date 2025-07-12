import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { comparePassword, generateToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import type { User } from "@/lib/models/User";
import { handleOptions, withCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const db = await getDatabase();
    const usersCollection = db.collection<User>("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.warn("🔴 Login failed: User not found");
      const res = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      return withCors(res, request);
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      console.warn("🔴 Login failed: Password mismatch");
      const res = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      return withCors(res, request);
    }

    // Optional: Track last login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const token = generateToken(user);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    // ✅ Set cookie with cross-site safety in prod
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return withCors(response, request);
  } catch (error: any) {
    console.error("🔥 Login error:", error.message || error);

    const errorRes = NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
    return withCors(errorRes, request);
  }
}
