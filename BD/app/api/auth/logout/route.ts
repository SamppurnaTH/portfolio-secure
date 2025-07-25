import { type NextRequest, NextResponse } from "next/server"
import { withCors, handleOptions } from "@/lib/cors"

// ✅ Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

// ✅ Logout handler
export async function POST(request: NextRequest) {
  // 📝 Optional: Log logout time or token to audit logs here
  // Example: await saveLogoutAudit(userId, new Date())

  // 🔐 Clear the cookie using both `maxAge: 0` and `expires: new Date(0)` for full compatibility
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
    timestamp: new Date().toISOString(), // ⏱️ Optional metadata
  })

  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/", // ensures all paths are cleared
    maxAge: 0,
    expires: new Date(0), // 🔁 extra measure to force expire
  })

  return withCors(response, request)
}
