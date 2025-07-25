// B:\Portfolio\BD\app\api\contact\[id]\route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { contactSchema } from "@/lib/validation"; // Re-import if not used
import type { Contact } from "@/lib/models/Contact";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { withCors, handleOptions } from "@/lib/cors"; // <--- ADDED IMPORT
import { authenticateRequest } from "@/lib/auth"; // <--- ADDED IMPORT

// Reuse schema for partial updates
// Assuming contactSchema from validation.ts defines the full shape
// and contactSchema.partial() is correct for updates.
const contactUpdateSchema = contactSchema.partial();

// ✅ Helper to parse ID from URL (modified to return NextResponse with CORS)
function parseIdFromRequest(request: NextRequest): ObjectId | NextResponse {
  const segments = request.url.split("/");
  const id = segments[segments.length - 1]; // Gets the [id] from the path

  if (!id || !ObjectId.isValid(id)) {
    // Return an error response wrapped with CORS immediately
    return withCors(
      NextResponse.json(
        { error: "❌ Invalid or missing contact ID." },
        { status: 400 }
      ),
      request
    );
  }

  return new ObjectId(id);
}

// ✅ OPTIONS Handler (for CORS preflight)
// This is essential for PUT, PATCH, DELETE requests.
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ✅ GET contact by ID
export async function GET(request: NextRequest) {
  // ⛔ AUTHENTICATION & AUTHORIZATION CHECK
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult; // If authentication/authorization failed, return the error response (already has CORS)
  }
  // User is authenticated and authorized (e.g., admin) if execution reaches here
  // const { user } = authResult; // Access user info if needed

  const idResult = parseIdFromRequest(request);
  if (idResult instanceof NextResponse) {
    return idResult; // Return error from parseIdFromRequest (already has CORS)
  }
  const objectId = idResult;

  try {
    const db = await getDatabase();
    const contactsCollection = db.collection<Contact>("contacts");
    const contact = await contactsCollection.findOne({ _id: objectId });

    if (!contact) {
      return withCors( // <--- WRAP WITH CORS
        NextResponse.json(
          { success: false, message: "Contact not found." },
          { status: 404 }
        ),
        request // <--- PASS REQUEST
      );
    }

    return withCors( // <--- WRAP WITH CORS
      NextResponse.json({ success: true, data: contact }),
      request // <--- PASS REQUEST
    );
  } catch (error) {
    console.error(`Error fetching contact with ID ${objectId}:`, error);
    return withCors( // <--- WRAP WITH CORS
      NextResponse.json(
        { error: "🚫 Failed to retrieve contact. Please try again later." },
        { status: 500 }
      ),
      request // <--- PASS REQUEST
    );
  }
}

// ✅ PUT update contact by ID
export async function PUT(request: NextRequest) {
  // ⛔ AUTHENTICATION & AUTHORIZATION CHECK
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const idResult = parseIdFromRequest(request);
  if (idResult instanceof NextResponse) {
    return idResult;
  }
  const objectId = idResult;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error('PUT /api/contact/[id] - Invalid JSON body:', err);
    return withCors(
      NextResponse.json({ error: "Invalid or missing JSON body" }, { status: 400 }),
      request
    );
  }
  if (!body || Object.keys(body).length === 0) {
    console.error('PUT /api/contact/[id] - Empty request body');
    return withCors(
      NextResponse.json({ error: "Request body cannot be empty" }, { status: 400 }),
      request
    );
  }

  try {
    console.log('PUT /api/contact/[id] - Request body:', body);
    const validatedData = contactUpdateSchema.parse(body);
    console.log('PUT /api/contact/[id] - Validated data:', validatedData);

    const db = await getDatabase();
    const contactsCollection = db.collection<Contact>("contacts");
    const result = await contactsCollection.updateOne(
      { _id: objectId },
      { $set: validatedData }
    );
    console.log('PUT /api/contact/[id] - MongoDB update result:', result);

    if (result.matchedCount === 0) {
      return withCors( // <--- WRAP WITH CORS
        NextResponse.json(
          { success: false, message: "Contact not found." },
          { status: 404 }
        ),
        request // <--- PASS REQUEST
      );
    }

    const updatedContact = await contactsCollection.findOne({ _id: objectId });

    return withCors( // <--- WRAP WITH CORS
      NextResponse.json({
        success: true,
        message: "✅ Contact updated successfully.",
        data: updatedContact,
      }),
      request // <--- PASS REQUEST
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('PUT /api/contact/[id] - Validation error:', error.errors);
      return withCors( // <--- WRAP WITH CORS
        NextResponse.json(
          {
            error: "❌ Invalid input for update",
            issues: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
        request // <--- PASS REQUEST
      );
    }
    console.error('PUT /api/contact/[id] - Unexpected error:', error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    return withCors( // <--- WRAP WITH CORS
      NextResponse.json(
        { error: "🚫 Failed to update contact. Please try again later." },
        { status: 500 }
      ),
      request // <--- PASS REQUEST
    );
  }
}

// ✅ DELETE contact by ID
export async function DELETE(request: NextRequest) {
  // ⛔ AUTHENTICATION & AUTHORIZATION CHECK
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const idResult = parseIdFromRequest(request);
  if (idResult instanceof NextResponse) {
    return idResult;
  }
  const objectId = idResult;

  try {
    const db = await getDatabase();
    const contactsCollection = db.collection<Contact>("contacts");
    const result = await contactsCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return withCors( // <--- WRAP WITH CORS
        NextResponse.json(
          { success: false, message: "Contact not found." },
          { status: 404 }
        ),
        request // <--- PASS REQUEST
      );
    }

    return withCors( // <--- WRAP WITH CORS
      NextResponse.json({
        success: true,
        message: "✅ Contact deleted successfully.",
      }),
      request // <--- PASS REQUEST
    );
  } catch (error) {
    console.error(`Error deleting contact with ID ${objectId}:`, error);
    return withCors( // <--- WRAP WITH CORS
      NextResponse.json(
        { error: "🚫 Failed to delete contact. Please try again later." },
        { status: 500 }
      ),
      request // <--- PASS REQUEST
    );
  }
}
