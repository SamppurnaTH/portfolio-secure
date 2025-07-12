// B:\Portfolio\BD\app\api\contact\bulk\route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { Contact } from "@/lib/models/Contact";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { withCors, handleOptions } from "@/lib/cors"; // <--- ADDED IMPORT
import { authenticateRequest } from "@/lib/auth"; // <--- ADDED IMPORT

// ✅ Bulk action input schema
const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1, "ID cannot be empty")),
  action: z.enum(["delete", "update"]).optional(), // Added update action
  status: z.enum(["new", "read", "replied", "archived"]).optional(), // Added status for updates
}).refine(data => {
    // If action is 'update', then 'status' must be provided
    if (data.action === "update" && !data.status) {
        return false;
    }
    return true;
}, {
    message: "Status is required for 'update' action.",
    path: ["status"],
});


// ✅ OPTIONS Handler (for CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ✅ POST: /api/contact/bulk – Handles bulk actions (delete, update status)
export async function POST(request: NextRequest) {
  // ⛔ AUTHENTICATION & AUTHORIZATION CHECK
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult; // If authentication/authorization failed, return the error response
  }

  try {
    const body = await request.json();
    const { ids, action, status } = bulkActionSchema.parse(body);

    const validObjectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (validObjectIds.length === 0) {
      return withCors( // <--- WRAP WITH CORS
        NextResponse.json({ error: "❌ No valid ObjectIds provided." }, { status: 400 }),
        request // <--- PASS REQUEST
      );
    }

    const db = await getDatabase();
    const contactsCollection = db.collection<Contact>("contacts");
    let message = "";
    let affectedCount = 0;

    if (action === "delete") {
      const result = await contactsCollection.deleteMany({ _id: { $in: validObjectIds } });
      affectedCount = result.deletedCount;
      message = `🗑️ ${affectedCount} contact(s) deleted successfully.`;
    } else if (action === "update" && status) {
      const result = await contactsCollection.updateMany(
        { _id: { $in: validObjectIds } },
        { $set: { status: status } }
      );
      affectedCount = result.modifiedCount;
      message = `🔄 ${affectedCount} contact(s) updated to status '${status}' successfully.`;
    } else {
        return withCors( // <--- WRAP WITH CORS
            NextResponse.json({ error: "❌ Invalid or unsupported bulk action." }, { status: 400 }),
            request // <--- PASS REQUEST
        );
    }

    return withCors( // <--- WRAP WITH CORS
      NextResponse.json({
        success: true,
        affectedCount: affectedCount,
        message: message,
      }),
      request // <--- PASS REQUEST
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withCors( // <--- WRAP WITH CORS
        NextResponse.json(
          {
            error: "❌ Invalid request format for bulk action",
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

    console.error("Bulk action error:", error);
    return withCors( // <--- WRAP WITH CORS
      NextResponse.json(
        {
          error: "🚫 Failed to perform bulk action. Please try again later.",
        },
        { status: 500 }
      ),
      request // <--- PASS REQUEST
    );
  }
}
