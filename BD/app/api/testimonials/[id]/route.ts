import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  requireAdmin,
  AuthenticatedRequest,
  NextRouteContext,
} from "@/lib/middleware/auth";
import type { Testimonial } from "@/lib/models/Testimonial";
import { z } from "zod";
import { withCors, handleOptions } from "@/lib/cors";
import { relationshipEnum } from "@/lib/validation"; // ✅ Import the relationshipEnum

// ---------------------------
// Zod schema for validation
// ---------------------------
const statusEnum = z.enum(["published", "draft"]);

const testimonialSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().min(2).max(100),
  company: z.string().min(2).max(100),
  image: z.string().url(),
  content: z.string().min(10).max(1000),
  rating: z.number().min(1).max(5),
  relationship: relationshipEnum, // ✅ FIXED: Use enum instead of plain string
  project: z.string().min(2).max(100),
  featured: z.boolean().optional(),
  status: statusEnum.default("draft").optional(),
});

// ---------------------------
// Helper to extract ID
// ---------------------------
const extractId = (params: { [key: string]: string | string[] }) => {
  const id = params.id;
  return Array.isArray(id) ? id[0] : id;
};

// ---------------------------
// OPTIONS - CORS preflight
// ---------------------------
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ---------------------------
// GET - Public: Get one testimonial
// ---------------------------
export async function GET(request: NextRequest, context: NextRouteContext) {
  try {
    const { params } = context;
    const id = extractId(params);

    if (!id || !ObjectId.isValid(id)) {
      return withCors(
        NextResponse.json({ error: "Invalid testimonial ID" }, { status: 400 }),
        request
      );
    }

    const db = await getDatabase();
    const testimonials = db.collection<Testimonial>("testimonials");

    const testimonial = await testimonials.findOne({ _id: new ObjectId(id) });

    if (!testimonial) {
      return withCors(
        NextResponse.json({ error: "Testimonial not found" }, { status: 404 }),
        request
      );
    }

    return withCors(
      NextResponse.json({ success: true, data: testimonial }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request
    );
  }
}

// ---------------------------
// PUT - Admin: Update testimonial
// ---------------------------
export const PUT = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid testimonial ID" }, { status: 400 }),
          request
        );
      }

      const body = await request.json();
      const validation = testimonialSchema.safeParse(body);

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

      const db = await getDatabase();
      const testimonials = db.collection<Testimonial>("testimonials");

      const result = await testimonials.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...validation.data,
            featured: validation.data.featured ?? false,
            status: validation.data.status ?? "draft",
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Testimonial not found" }, { status: 404 }),
          request
        );
      }

      const updated = await testimonials.findOne({ _id: new ObjectId(id) });

      return withCors(
        NextResponse.json({ success: true, data: updated }),
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

// ---------------------------
// DELETE - Admin: Delete testimonial
// ---------------------------
export const DELETE = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid testimonial ID" }, { status: 400 }),
          request
        );
      }

      const db = await getDatabase();
      const testimonials = db.collection<Testimonial>("testimonials");

      const result = await testimonials.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Testimonial not found" }, { status: 404 }),
          request
        );
      }

      return withCors(
        NextResponse.json({ success: true, message: "Testimonial deleted successfully" }),
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
