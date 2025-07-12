import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { hireMeSchema, contactSchema } from "@/lib/validation";
import type { Contact } from "@/lib/models/Contact";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { withCors, handleOptions } from "@/lib/cors";

// 🚫 Simple in-memory rate limiter (for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) return false;

  record.count++;
  return true;
}

// ✅ OPTIONS Handler (for CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ✅ POST: /api/contact – Handles both contact and hire-me forms
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // ⛔ Rate limit check
    if (!checkRateLimit(ip)) {
      return withCors(
        NextResponse.json({ error: "⚠️ Too many requests. Please try again later." }, { status: 429 }),
        request
      );
    }

    const body = await request.json();
    let validatedData: Partial<Contact>;

    // ✅ Validate using contact or hire-me schema
    try {
      validatedData = contactSchema.parse(body);
    } catch (contactErr) {
      try {
        validatedData = hireMeSchema.parse(body);
      } catch (hireMeErr) {
        // ⚠️ Invalid request
        return withCors(
          NextResponse.json({
            error: "❌ Invalid input",
            issues: [
              ...(contactErr instanceof z.ZodError ? contactErr.errors : []),
              ...(hireMeErr instanceof z.ZodError ? hireMeErr.errors : []),
            ].map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          }, { status: 400 }),
          request
        );
      }
    }

    const db = await getDatabase();
    const contacts = db.collection<Contact>("contacts");

    const newContact: Contact = {
      ...validatedData,
      status: "new",
      createdAt: new Date(),
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    } as Contact;

    const result = await contacts.insertOne(newContact);

    return withCors(
      NextResponse.json({
        success: true,
        message: "✅ Message received. We'll respond within 24–48 hours.",
        id: result.insertedId,
      }),
      request
    );
  } catch (error) {
    console.error("POST error:", error);
    return withCors(
      NextResponse.json({ error: "🚫 Failed to submit message." }, { status: 500 }),
      request
    );
  }
}

// ✅ GET: /api/contact – Fetch all or filter by `status` or `id`
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const contacts = db.collection<Contact>("contacts");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Contact["status"] | null;
    const id = searchParams.get("id");

    const query: any = {};

    if (status && ["new", "read", "archived"].includes(status)) {
      query.status = status;
    }

    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch {
        return withCors(
          NextResponse.json({ error: "❌ Invalid ID format." }, { status: 400 }),
          request
        );
      }
    }

    const results = await contacts.find(query).sort({ createdAt: -1 }).toArray();

    return withCors(
      NextResponse.json({
        success: true,
        data: results,
        message: results.length > 0
          ? "✅ Contacts fetched successfully."
          : "No contacts found.",
      }),
      request
    );
  } catch (error) {
    console.error("GET error:", error);
    return withCors(
      NextResponse.json({ error: "🚫 Failed to fetch contacts." }, { status: 500 }),
      request
    );
  }
}
