import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  requireAdmin,
  AuthenticatedRequest,
  NextRouteContext,
} from "@/lib/middleware/auth";
import { experienceSchema } from "@/lib/validation";
import type { Experience } from "@/lib/models/Experience";
import { withCors, handleOptions } from "@/lib/cors";

// Helper to extract ID from route params
const extractId = (params: { [key: string]: string | string[] }) => {
  const id = params.id;
  return Array.isArray(id) ? id[0] : id;
};

// ----------------------------------------------
// GET - Fetch a single experience (public)
// ----------------------------------------------
export async function GET(
  request: NextRequest,
  context: NextRouteContext
) {
  try {
    const { params } = context;
    const id = extractId(params);

    if (!id || !ObjectId.isValid(id)) {
      return withCors(
        NextResponse.json({ error: "Invalid or missing experience ID" }, { status: 400 }),
        request
      );
    }

    const db = await getDatabase();
    const experienceCollection = db.collection<Experience>("experience");

    const experience = await experienceCollection.findOne({ _id: new ObjectId(id) });

    if (!experience) {
      return withCors(
        NextResponse.json({ error: "Experience not found" }, { status: 404 }),
        request
      );
    }

    return withCors(
      NextResponse.json({ success: true, data: experience }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request
    );
  }
}

// ----------------------------------------------
// PUT - Update experience (admin only)
// ----------------------------------------------
export const PUT = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid or missing experience ID" }, { status: 400 }),
          request
        );
      }

      const body = await request.json();
      const validation = experienceSchema.safeParse(body);

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
      const db = await getDatabase();
      const experienceCollection = db.collection<Experience>("experience");

      const result = await experienceCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...validatedData,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Experience not found" }, { status: 404 }),
          request
        );
      }

      const updatedExperience = await experienceCollection.findOne({ _id: new ObjectId(id) });

      return withCors(
        NextResponse.json({ success: true, data: updatedExperience }),
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

// ----------------------------------------------
// DELETE - Delete experience (admin only)
// ----------------------------------------------
export const DELETE = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid or missing experience ID" }, { status: 400 }),
          request
        );
      }

      const db = await getDatabase();
      const experienceCollection = db.collection<Experience>("experience");

      const result = await experienceCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Experience not found" }, { status: 404 }),
          request
        );
      }

      return withCors(
        NextResponse.json({ success: true, message: "Experience deleted successfully" }),
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

// ----------------------------------------------
// OPTIONS - CORS preflight
// ----------------------------------------------
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}
