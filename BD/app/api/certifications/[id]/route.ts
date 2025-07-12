import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  requireAdmin,
  AuthenticatedRequest,
  NextRouteContext,
} from "@/lib/middleware/auth";
import { certificationSchema } from "@/lib/validation";
import type { Certification } from "@/lib/models/Certification";
import { withCors, handleOptions } from "@/lib/cors";

// Optional: For environments using static optimization (Next.js App Router)
export const dynamic = "force-dynamic";

// Extract ID from dynamic route
const extractId = (params: { [key: string]: string | string[] }) => {
  const id = params.id;
  return Array.isArray(id) ? id[0] : id;
};

// ---------------------------------------------
// OPTIONS - CORS preflight
// ---------------------------------------------
export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ---------------------------------------------
// GET - Public: Get one certification by ID
// ---------------------------------------------
export async function GET(request: NextRequest, context: NextRouteContext) {
  try {
    const { params } = context;
    const id = extractId(params);

    if (!id || !ObjectId.isValid(id)) {
      return withCors(
        NextResponse.json({ error: "Invalid certification ID" }, { status: 400 }),
        request
      );
    }

    const db = await getDatabase();
    const certifications = db.collection<Certification>("certifications");

    const cert = await certifications.findOne({ _id: new ObjectId(id) });

    if (!cert) {
      return withCors(
        NextResponse.json({ error: "Certification not found" }, { status: 404 }),
        request
      );
    }

    return withCors(
      NextResponse.json({ success: true, data: cert }),
      request
    );
  } catch (error) {
    console.error("GET /api/certifications/[id] error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request
    );
  }
}

// ---------------------------------------------
// PUT - Admin: Update certification
// ---------------------------------------------
export const PUT = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid certification ID" }, { status: 400 }),
          request
        );
      }

      const body = await request.json();
      const validation = certificationSchema.safeParse(body);

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
      const certifications = db.collection<Certification>("certifications");

      const result = await certifications.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...validation.data,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Certification not found" }, { status: 404 }),
          request
        );
      }

      const updated = await certifications.findOne({ _id: new ObjectId(id) });

      return withCors(
        NextResponse.json({ success: true, data: updated }),
        request
      );
    } catch (error) {
      console.error("PUT /api/certifications/[id] error:", error);
      return withCors(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        request
      );
    }
  }
);

// ---------------------------------------------
// DELETE - Admin: Delete certification
// ---------------------------------------------
export const DELETE = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid certification ID" }, { status: 400 }),
          request
        );
      }

      const db = await getDatabase();
      const certifications = db.collection<Certification>("certifications");

      const result = await certifications.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Certification not found" }, { status: 404 }),
          request
        );
      }

      return withCors(
        NextResponse.json({ success: true, message: "Certification deleted successfully" }),
        request
      );
    } catch (error) {
      console.error("DELETE /api/certifications/[id] error:", error);
      return withCors(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        request
      );
    }
  }
);
