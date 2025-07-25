import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/middleware/auth"
import type { Project } from "@/lib/models/Project"
import type { Post } from "@/lib/models/Post"
import type { Contact } from "@/lib/models/Contact"
import { withCors, handleOptions } from "@/lib/cors" 

interface DashboardData {
  projects: Project[]
  posts: Post[]
  contact: Contact[]
}

// ✅ Handle GET /api/dashboard
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const db = await getDatabase()

    const [projects, posts, contacts] = await Promise.all([
      db.collection<Project>("projects").find({}).toArray(),
      db.collection<Post>("posts").find({}).toArray(),
      db.collection<Contact>("contacts").find({}).toArray()
    ])

    const responseData: DashboardData = {
      projects,
      posts,
      contact: contacts
    }

    return withCors(
      NextResponse.json({ success: true, data: responseData }),
      request
    )

  } catch (error: unknown) {
    console.error("GET /api/dashboard error:", error)

    return withCors(
      NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      }, { status: 500 }),
      request
    )
  }
})

// ✅ Handle OPTIONS preflight
export const OPTIONS = async (request: NextRequest) => {
  return handleOptions(request)
}
