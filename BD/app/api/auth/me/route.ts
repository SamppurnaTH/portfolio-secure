import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { withCors, handleOptions } from "@/lib/cors"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    // ✅ Remove cookie logging for security
    // const allCookies = request.cookies.getAll()
    // console.log("📦 Received cookies:", allCookies)

    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      // ✅ Remove warning logging for security
      // console.warn("🔴 No auth-token cookie found")
      return withCors(
        NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 }),
        request
      )
    }

    const decoded = verifyToken(token)
    // ✅ Remove token logging for security
    // console.log("🧾 Decoded JWT token:", decoded)

    if (!decoded?.userId || !ObjectId.isValid(decoded.userId)) {
      // ✅ Remove warning logging for security
      // console.warn("⚠️ Invalid or malformed token")
      return withCors(
        NextResponse.json({ success: false, message: "Invalid token" }, { status: 403 }),
        request
      )
    }

    const db = await getDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      // ✅ Remove warning logging for security
      // console.warn("🛑 No user found for ID:", decoded.userId)
      return withCors(
        NextResponse.json({ success: false, message: "User not found" }, { status: 404 }),
        request
      )
    }

    // ✅ Remove user logging for security
    // console.log("✅ Authenticated user:", user.email)

    return withCors(
      NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }),
      request
    )
  } catch (error: unknown) {
    // ✅ Keep error logging but remove sensitive details
    console.error("🔥 Error in /api/auth/me:", "Authentication error")
    return withCors(
      NextResponse.json({ success: false, message: "Server error" }, { status: 500 }),
      request
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}
