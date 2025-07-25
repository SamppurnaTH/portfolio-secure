// B:\Portfolio\BD\app\api\contact\reply\[id]\route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { withCors, handleOptions } from "@/lib/cors";
import { authenticateRequest } from "@/lib/auth";

const replySchema = z.object({
  admin: z.string().min(1, "Admin name is required"),
  message: z.string().min(1, "Message cannot be empty"),
  subject: z.string().optional(),
});

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Validate ID
  if (!params.id || !ObjectId.isValid(params.id)) {
    return withCors(
      NextResponse.json({ error: "Invalid contact ID" }, { status: 400 }),
      request
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
      request
    );
  }

  // Validate request body
  const validation = replySchema.safeParse(body);
  if (!validation.success) {
    return withCors(
      NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      ),
      request
    );
  }

  const { admin, message, subject } = validation.data;

  try {
    const db = await getDatabase();
    const contacts = db.collection("contacts");
    
    // Find the contact
    const contact = await contacts.findOne({ _id: new ObjectId(params.id) });
    if (!contact) {
      return withCors(
        NextResponse.json({ error: "Contact not found" }, { status: 404 }),
        request
      );
    }

    // Update contact in database (without email sending)
    const updateResult = await contacts.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: "replied",
          reply: {
            message,
            sentAt: new Date(),
            admin,
            // Removed emailId since we're not sending emails anymore
          }
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to update contact record");
    }

    return withCors(
      NextResponse.json({
        success: true,
        message: "Reply recorded successfully",
        contactId: params.id
      }),
      request
    );

  } catch (error) {
    console.error("Error in PATCH /api/contact/reply/[id]:", error);
    return withCors(
      NextResponse.json(
        { 
          error: "Failed to record reply",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      ),
      request
    );
  }
}