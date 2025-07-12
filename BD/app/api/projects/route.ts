// B:\Portfolio\BD\app\api\projects\route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { requireAdmin } from "@/lib/middleware/auth" // This wrapper provides `request`
import { projectSchema } from "@/lib/validation"
import { generateSlug } from "@/lib/auth"
import type { Project } from "@/lib/models/Project"
import { withCors, handleOptions } from "@/lib/cors"
import { z } from "zod" // Import z for ZodError handling

// ✅ OPTIONS (Preflight)
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request) // handleOptions correctly uses 'request' internally
}

// ✅ GET - Public Fetch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")
    const status = searchParams.get("status") || "published"

    const db = await getDatabase()
    const projectsCollection = db.collection<Project>("projects")

    const query: any = { status }
    if (category && category !== "all") {
      query.category = category
    }
    if (featured === "true") {
      query.featured = true
    }

    const projects = await projectsCollection.find(query).sort({ createdAt: -1 }).toArray()

    const response = NextResponse.json({ success: true, data: projects }) // Standardize response structure with success & data
    return withCors(response, request) // <--- ADDED 'request'
  } catch (error) {
    const response = NextResponse.json({ error: "🚫 Failed to retrieve projects. Please try again later." }, { status: 500 })
    return withCors(response, request) // <--- ADDED 'request'
  }
}

// ✅ POST - Admin Create
// requireAdmin wraps the async handler, providing 'request' and 'context'
// If auth fails, requireAdmin itself returns a NextResponse with CORS applied.
export const POST = requireAdmin(async (request: NextRequest) => { // 'request' is available here
  try {
    const body = await request.json()
    const validatedData = projectSchema.parse(body)

    const db = await getDatabase()
    const projectsCollection = db.collection<Project>("projects")

    const slug = generateSlug(validatedData.title)

    const existingProject = await projectsCollection.findOne({ slug })
    if (existingProject) {
      const response = NextResponse.json({ error: "Project with this title already exists" }, { status: 400 })
      return withCors(response, request) // <--- ADDED 'request'
    }

    const projectData: Project = {
      ...validatedData,
      slug,
      featured: validatedData.featured || false,
      status: validatedData.status || "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0,
    }

    const result = await projectsCollection.insertOne(projectData)

    const response = NextResponse.json({
      success: true,
      message: "✅ Project created successfully.",
      data: { ...projectData, _id: result.insertedId.toString() }, // Ensure _id is string for client-side
    }, { status: 201 }) // Return 201 Created for successful resource creation

    return withCors(response, request) // <--- ADDED 'request'
  } catch (error) {
    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        {
          error: "❌ Invalid input for project creation",
          issues: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      )
      return withCors(response, request) // <--- ADDED 'request'
    }

    const response = NextResponse.json({ error: "🚫 Failed to create project. Please try again later." }, { status: 500 })
    return withCors(response, request) // <--- ADDED 'request'
  }
})