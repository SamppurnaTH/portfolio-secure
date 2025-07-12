import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth"
import { registerSchema } from "@/lib/validation"
import type { User } from "@/lib/models/User"
import { withCors, handleOptions } from "@/lib/cors" // Optional but recommended

// ✅ Optional: Preflight handler
export async function OPTIONS(req: NextRequest) {
  return handleOptions(req)
}

export async function POST(request: NextRequest) {
  try {
    const jsonBody: unknown = await request.json()

    // ✅ Validate input
    const validatedData = registerSchema.parse(jsonBody)
    const { name, email, password } = validatedData

    const db = await getDatabase()
    const usersCollection = db.collection<User>("users")

    // ✅ Check if user exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return withCors(
        NextResponse.json({ error: "User already exists" }, { status: 409 }),
        request
      )
    }

    // ✅ Hash password
    const hashedPassword = await hashPassword(password)

    const now = new Date()
    const newUser: User = {
      name,
      email,
      password: hashedPassword,
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
    }

    const insertResult = await usersCollection.insertOne(newUser)

    // ✅ Generate secure token (omit hashed password)
    const token = generateToken({
      _id: insertResult.insertedId,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    } as any)

    // ✅ Prepare response
    const response = NextResponse.json({
      success: true,
      user: {
        id: insertResult.insertedId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return withCors(response, request) // Optional but highly recommended
  } catch (error: any) {
    console.error("Register error:", error)

    // ✅ Handle Zod validation errors
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors?.[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
