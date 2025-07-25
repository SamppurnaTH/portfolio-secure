import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/middleware/auth"
import { handleOptions, withCors } from "@/lib/cors"

// ✅ Preflight handler for CORS
export function OPTIONS(req: NextRequest) {
  return handleOptions(req)
}

// ✅ Main GET route
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const db = await getDatabase()

    const [projectsCount, postsCount, testimonialsCount, contactsCount, newContactsCount] = await Promise.all([
      db.collection("projects").countDocuments({ status: "published" }),
      db.collection("posts").countDocuments({ status: "published" }),
      db.collection("testimonials").countDocuments({ status: "published" }),
      db.collection("contacts").countDocuments(),
      db.collection("contacts").countDocuments({ status: "new" }),
    ])

    const recentContacts = await db.collection("contacts").find().sort({ createdAt: -1 }).limit(5).toArray()
    const recentPosts = await db.collection("posts").find({ status: "published" }).sort({ createdAt: -1 }).limit(3).toArray()

    const projectStats = await db
      .collection("projects")
      .aggregate([
        { $match: { status: "published" } },
        { $group: { _id: null, totalViews: { $sum: "$views" }, totalLikes: { $sum: "$likes" } } },
      ])
      .toArray()

    const postStats = await db
      .collection("posts")
      .aggregate([
        { $match: { status: "published" } },
        { $group: { _id: null, totalViews: { $sum: "$views" }, totalLikes: { $sum: "$likes" } } },
      ])
      .toArray()

    const stats = {
      overview: {
        projects: projectsCount,
        posts: postsCount,
        testimonials: testimonialsCount,
        contacts: contactsCount,
        newContacts: newContactsCount,
        totalViews: (projectStats[0]?.totalViews || 0) + (postStats[0]?.totalViews || 0),
        totalLikes: (projectStats[0]?.totalLikes || 0) + (postStats[0]?.totalLikes || 0),
      },
      recent: {
        contacts: recentContacts,
        posts: recentPosts,
      },
    }

    const response = new NextResponse(JSON.stringify({ success: true, data: stats }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

    return withCors(response, request)
  } catch (error) {
    console.error("Get stats error:", error)
    const errorResponse = new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
    return withCors(errorResponse, request)
  }
})
