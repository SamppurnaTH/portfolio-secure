// B:\Portfolio\BD\app\api\experience\route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/middleware/auth";
import { experienceSchema } from "@/lib/validation";
import type { Experience } from "@/lib/models/Experience";
import { withCors, handleOptions } from "@/lib/cors";
import { z } from "zod"; // <--- Ensure 'z' is imported for ZodError

// ---------------------------------
// GET - Fetch all experience entries (public)
// ---------------------------------
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const experienceCollection = db.collection<Experience>("experience");

    const experiences = await experienceCollection
      .find({})
      .sort({ startDate: -1 }) // Most recent experience first
      .toArray();

    return withCors(
      NextResponse.json({ success: true, data: experiences }),
      request
    );
  } catch (error) {
    console.error("GET /api/experience error:", error);
    return withCors(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      ),
      request
    );
  }
}

// ---------------------------------
// POST - Create new experience (admin only)
// ---------------------------------
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate data using Zod
    const validatedData = experienceSchema.parse(body); // This can throw ZodError

    const db = await getDatabase();
    const experienceCollection = db.collection<Experience>("experience");

    const now = new Date();

    const newExperience: Experience = {
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await experienceCollection.insertOne(newExperience);

    return withCors(
      NextResponse.json({
        success: true,
        message: "✅ Experience entry created successfully.", // Added success message
        data: { ...newExperience, _id: result.insertedId },
      }, { status: 201 }), // Added 201 status for creation
      request
    );
  } catch (error) {
    console.error("POST /api/experience error:", error);

    // --- Specific ZodError handling ---
    if (error instanceof z.ZodError) {
      return withCors(
        NextResponse.json(
          { 
            success: false, 
            message: "Validation Error", 
            issues: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            })) 
          },
          { status: 400 } // Bad Request for validation errors
        ),
        request
      );
    }
    // --- End ZodError handling ---

    // Generic error for any other unhandled exceptions
    return withCors(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      ),
      request
    );
  }
});

// ---------------------------------
// OPTIONS - Handle CORS preflight (can be at the top or bottom, but consistently one place)
// ---------------------------------
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}