import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  requireAdmin,
  AuthenticatedRequest,
  NextRouteContext,
} from "@/lib/middleware/auth";
import { projectSchema } from "@/lib/validation";
import type { Project } from "@/lib/models/Project";
import { withCors, handleOptions } from "@/lib/cors"; // ✅ CORS helpers

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// Helper to extract ID or slug
const extractId = (params: { [key: string]: string | string[] }) => {
  const id = params.id;
  return Array.isArray(id) ? id[0] : id;
};

// --------------------------------------
// GET - Fetch a single project (public) and increment view count
// --------------------------------------
export async function GET(request: NextRequest, context: NextRouteContext) {
  try {
    const { params } = context;
    const id = extractId(params);

    if (!id) {
      return withCors(
        NextResponse.json({ error: "Missing project ID or slug" }, { status: 400 }),
        request
      );
    }

    const db = await getDatabase();
    const collection = db.collection<Project>("projects");

    // Find the project by ID or slug and increment its views in one operation.
    // returnDocument: 'after' ensures we get the document *after* the update.
    // Based on your TypeScript errors, we expect this to directly return the document or null.
    const updatedProject = await collection.findOneAndUpdate(
      {
        $or: [
          { _id: ObjectId.isValid(id) ? new ObjectId(id) : undefined },
          { slug: id },
        ],
      },
      { $inc: { views: 1 } }, // Increment the 'views' field by 1
      { returnDocument: 'after' } // Return the document after the update
    );

    // Check if the project was found and updated
    // updatedProject will be null if no document matched the query
    if (!updatedProject) { // Direct check for null, as per your TypeScript errors
      return withCors(
        NextResponse.json({ error: "Project not found" }, { status: 404 }),
        request
      );
    }

    // Return the project with the incremented view count
    // If updatedProject is not null, it's guaranteed to be a Project document by TypeScript
    return withCors(NextResponse.json({ success: true, data: updatedProject }), request);
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request
    );
  }
}

// --------------------------------------
// PUT - Update a project (admin only)
// --------------------------------------
export const PUT = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid or missing project ID" }, { status: 400 }),
          request
        );
      }

      const body = await request.json();
      const validation = projectSchema.safeParse(body);

      if (!validation.success) {
        return withCors(
          NextResponse.json(
            {
              error: "Validation failed",
              issues: validation.error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
            { status: 400 }
          ),
          request
        );
      }

      const validatedData = validation.data;
      const slug = validatedData.title.trim().toLowerCase().replace(/\s+/g, "-");

      const db = await getDatabase();
      const collection = db.collection<Project>("projects");

      const duplicate = await collection.findOne({
        slug,
        _id: { $ne: new ObjectId(id) },
      });

      if (duplicate) {
        return withCors(
          NextResponse.json({ error: "Slug already exists" }, { status: 400 }),
          request
        );
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...validatedData,
            slug,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Project not found" }, { status: 404 }),
          request
        );
      }

      const updatedProject = await collection.findOne({ _id: new ObjectId(id) });

      return withCors(
        NextResponse.json({ success: true, data: updatedProject }),
        request
      );
    } catch (error) {
      return withCors(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        request
      );
    }
  }
);

// --------------------------------------
// DELETE - Remove a project (admin only)
// --------------------------------------
export const DELETE = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid or missing project ID" }, { status: 400 }),
          request
        );
      }

      const db = await getDatabase();
      const collection = db.collection<Project>("projects");

      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Project not found" }, { status: 404 }),
          request
        );
      }

      return withCors(
        NextResponse.json({ success: true, message: "Project deleted successfully" }),
        request
      );
    } catch (error) {
      return withCors(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        request
      );
    }
  }
);