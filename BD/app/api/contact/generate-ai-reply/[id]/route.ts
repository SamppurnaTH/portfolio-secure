// B:\Portfolio\BD\app\api\contact\generate-ai-reply\[id]\route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { generateReplyFromDeepSeek } from "@/lib/ai";
import { withCors, handleOptions } from "@/lib/cors";
import { authenticateRequest } from "@/lib/auth";

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // NEW APPROACH: Create an async function to handle params
    const getParams = async () => context.params;
    const params = await getParams();
    const id = params.id;

    // Alternative approach if above doesn't work:
    // const id = (await Promise.resolve(context.params)).id;

    // AUTHENTICATION
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!id || !ObjectId.isValid(id)) {
      return withCors(
        NextResponse.json({ error: "Invalid contact ID" }, { status: 400 }),
        request
      );
    }

    const db = await getDatabase();
    const contacts = db.collection("contacts");
    const contact = await contacts.findOne({ _id: new ObjectId(id) });

    if (!contact) {
      return withCors(
        NextResponse.json({ error: "Contact not found" }, { status: 404 }),
        request
      );
    }

    console.log("DEBUG: Generating AI draft for contact:", id);

    const aiGeneratedDraft = await generateReplyFromDeepSeek(`Client Name: ${contact.name}
Project Type: ${contact.projectType}
Company: ${contact.company ?? "Not specified"}
Budget: ${contact.budget ?? "Not specified"}
Message: ${contact.message}

Please write a polite, professional reply thanking the client and offering to discuss the project further.
Focus on providing a comprehensive draft that can be sent directly or with minor edits.`);

    return withCors(
      NextResponse.json({
        success: true,
        generatedReply: aiGeneratedDraft,
        message: "AI draft generated successfully.",
      }),
      request
    );
  } catch (error) {
    console.error("ERROR: AI draft generation failed:", error);
    return withCors(
      NextResponse.json(
        {
          error: "🚫 Failed to generate AI draft.",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      ),
      request
    );
  }
}