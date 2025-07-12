import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/middleware/auth";
import { z } from "zod";
import { withCors, handleOptions } from "@/lib/cors";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { Testimonial } from "@/lib/models/Testimonial";

// -----------------------------
// Zod Schema
// -----------------------------
const statusEnum = z.enum(["published", "draft"]);

// Define relationship enum that matches your Testimonial type
const relationshipEnum = z.enum([
  "supervisor",
  "mentor",
  "colleague",
  "client",
  "manager",
  "teamLead",
  "stakeholder",
  "partner",
]);

const testimonialSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().min(2).max(100),
  company: z.string().min(2).max(100),
  image: z.string().url(),
  content: z.string().min(10).max(1000),
  rating: z.number().min(1).max(5),
  relationship: relationshipEnum, // Use the enum instead of generic string
  // MODIFICATION: Make project optional and allow empty string before conversion to undefined
  project: z.string().max(100).optional().or(z.literal("")), // Allows empty string, then optional
  featured: z.boolean().optional(),
  status: statusEnum.optional(),
});

type TestimonialInput = z.infer<typeof testimonialSchema>;

// -----------------------------
// OPTIONS - Handle CORS preflight
// -----------------------------
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// -----------------------------
// GET - Public: Fetch all testimonials
// -----------------------------
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const testimonialsCollection = db.collection<Testimonial>("testimonials");

    // Add filtering logic to GET request based on your frontend's fetchTestimonials
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status');
    const relationshipFilter = searchParams.get('relationship');

    const query: any = {};
    if (searchTerm) {
      const sanitizedSearch = sanitizeSearchTerm(searchTerm);
      if (sanitizedSearch) {
        query.$or = [
          { name: { $regex: sanitizedSearch, $options: 'i' } },
          { content: { $regex: sanitizedSearch, $options: 'i' } },
          { company: { $regex: sanitizedSearch, $options: 'i' } },
          { role: { $regex: sanitizedSearch, $options: 'i' } },
        ];
      }
    }
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }
    if (relationshipFilter && relationshipFilter !== 'all') {
      query.relationship = relationshipFilter;
    }


    const testimonials = await testimonialsCollection
      .find(query) // Use the constructed query
      .sort({ createdAt: -1 })
      .toArray();

    return withCors(
      NextResponse.json({ success: true, data: testimonials }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      ),
      request
    );
  }
}

// -----------------------------
// POST - Admin: Add new testimonial
// -----------------------------
export const POST = requireAdmin(async (request: NextRequest) => {
  let body: any; // Declare body outside try block to be accessible in catch
  try {
    body = await request.json();

    // Validate against the schema
    const validatedData = testimonialSchema.parse(body);

    const db = await getDatabase();
    const testimonialsCollection = db.collection<Testimonial>("testimonials");

    const now = new Date();

    // Create the testimonial object
    const newTestimonial: Testimonial = {
      ...validatedData,
      // Ensure project is explicitly undefined if empty string, as per MongoDB model
      project: validatedData.project === "" ? undefined : validatedData.project,
      featured: validatedData.featured ?? false,
      status: validatedData.status ?? "draft",
      createdAt: now,
      updatedAt: now,
    };

    const result = await testimonialsCollection.insertOne(newTestimonial);

    return withCors(
      NextResponse.json({
        success: true,
        data: { ...newTestimonial, _id: result.insertedId },
      }),
      request
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            issues: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
              received: (e as any).received, // Add received value for debugging
            })),
            receivedData: body, // Include the body that caused the error for debugging
          },
          { status: 400 }
        ),
        request
      );
    }

    // Handle cases where request.json() fails or other unexpected errors
    return withCors(
      NextResponse.json(
        { 
          success: false, 
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error) // More descriptive error
        },
        { status: 500 }
      ),
      request
    );
  }
});