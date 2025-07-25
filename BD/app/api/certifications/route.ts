import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/middleware/auth";
import { withCors, handleOptions } from "@/lib/cors";
import { z } from "zod";
import type { Certification } from "@/lib/models/Certification";

// ✅ Final Zod validation schema (lean version)
const certificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  organization: z.string().min(1, "Organization is required").max(100),
  issueDate: z.string().min(1, "Issue date is required").max(10),
  description: z.string().optional().or(z.literal("")),
  badge: z.string().min(1, "Badge is required"),
  color: z.string().min(1, "Color is required"),
  credentialId: z.string().optional().or(z.literal("")),
  link: z.string().url("Invalid verification URL").optional().or(z.literal(""))
});

// ---------------------------------
// OPTIONS - Handle CORS preflight
// ---------------------------------
export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ---------------------------------
// GET - Fetch all certifications (public)
// ---------------------------------
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const certsCollection = db.collection<Certification>("certifications");

    const certifications = await certsCollection
      .find({})
      .sort({ issueDate: -1 })
      .toArray();

    return withCors(
      NextResponse.json({ success: true, data: certifications }),
      request
    );
  } catch (error) {
    console.error("GET /api/certifications error:", error);
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
// POST - Add a new certification (admin only)
// ---------------------------------
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    console.log("POST /api/certifications body:", body);

    // ✅ Validate input
    const validatedData = certificationSchema.parse(body);

    const db = await getDatabase();
    const certsCollection = db.collection<Certification>("certifications");

    // ✅ Prevent duplicate credentialId (if provided)
    if (validatedData.credentialId) {
      const existing = await certsCollection.findOne({ credentialId: validatedData.credentialId });
      if (existing) {
        return withCors(
          NextResponse.json(
            { success: false, error: "Certification with this credential ID already exists" },
            { status: 400 }
          ),
          request
        );
      }
    }

    const now = new Date();

    const newCert: Certification = {
      ...validatedData,
      createdAt: now,
      updatedAt: now
    };

    const result = await certsCollection.insertOne(newCert);

    return withCors(
      NextResponse.json({
        success: true,
        data: { ...newCert, _id: result.insertedId }
      }),
      request
    );
  } catch (error) {
    console.error("POST /api/certifications error:", error);

    if (error instanceof z.ZodError) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Validation Error", errors: error.errors },
          { status: 400 }
        ),
        request
      );
    }

    return withCors(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      ),
      request
    );
  }
});
