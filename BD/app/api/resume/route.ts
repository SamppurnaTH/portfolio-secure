import { NextRequest, NextResponse } from "next/server";
import { withCors, handleOptions } from "@/lib/cors";
import { authenticateRequest } from "@/lib/auth";
import { put, get, del } from "@vercel/blob";

const RESUME_BLOB_KEY = "resume/VENU_THOTA.pdf";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ------------------------------------
// GET: Public resume download
// ------------------------------------
export async function GET(request: NextRequest) {
  try {
    const blob = await get(RESUME_BLOB_KEY);
    if (!blob) {
      return withCors(
        NextResponse.json({ message: "Resume not found." }, { status: 404 }),
        request
      );
    }
    const response = new NextResponse(blob.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"VENU_THOTA.pdf\"`,
        "Content-Length": blob.size.toString(),
        "Cache-Control": "public, max-age=3600"
      },
    });
    return withCors(response, request);
  } catch (error) {
    console.error("GET /resume error:", error);
    return withCors(
      NextResponse.json({ message: "Internal server error." }, { status: 500 }),
      request
    );
  }
}

// ------------------------------------
// POST: Admin resume upload
// ------------------------------------
export async function POST(request: NextRequest) {
  try {
    const authResponse = await authenticateRequest(request);
    if (authResponse instanceof NextResponse) return authResponse;

    let formData;
    try {
      formData = await request.formData();
    } catch (formErr) {
      console.error("[RESUME UPLOAD] Error parsing FormData:", formErr);
      return withCors(
        NextResponse.json({ message: "Failed to parse form data." }, { status: 400 }),
        request
      );
    }

    const file = (formData.get("file") || formData.get("resume")) as File | null;
    if (!file) {
      return withCors(
        NextResponse.json({ message: "No file uploaded." }, { status: 400 }),
        request
      );
    }

    if (file.type !== "application/pdf") {
      return withCors(
        NextResponse.json({ message: "Only PDF files are allowed." }, { status: 400 }),
        request
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return withCors(
        NextResponse.json(
          { message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.` },
          { status: 400 }
        ),
        request
      );
    }

    let buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch (bufErr) {
      console.error("[RESUME UPLOAD] Error converting file to buffer:", bufErr);
      return withCors(
        NextResponse.json({ message: "Failed to process uploaded file." }, { status: 500 }),
        request
      );
    }

    try {
      await put(RESUME_BLOB_KEY, buffer, {
        access: "public",
        contentType: "application/pdf"
      });
    } catch (uploadErr) {
      console.error("[RESUME UPLOAD] Error uploading to blob storage:", uploadErr);
      return withCors(
        NextResponse.json({ message: "Failed to upload resume to storage." }, { status: 500 }),
        request
      );
    }

    // The public URL for the blob
    const blobUrl = `https://${process.env.VERCEL_BLOB_URL || "blob.vercel-storage.com"}/${RESUME_BLOB_KEY}`;

    return withCors(
      NextResponse.json({
        message: "Resume uploaded successfully.",
        data: { url: blobUrl }
      }),
      request
    );
  } catch (error) {
    console.error("POST /resume error:", error);
    return withCors(
      NextResponse.json({ message: "Failed to upload resume." }, { status: 500 }),
      request
    );
  }
}

// ------------------------------------
// DELETE: Admin resume deletion
// ------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const authResponse = await authenticateRequest(request);
    if (authResponse instanceof NextResponse) return authResponse;

    try {
      await del(RESUME_BLOB_KEY);
    } catch (delErr) {
      console.error("[RESUME DELETE] Error deleting from blob storage:", delErr);
      return withCors(
        NextResponse.json({ message: "Failed to delete resume from storage." }, { status: 500 }),
        request
      );
    }

    return withCors(
      NextResponse.json({ message: "Resume deleted successfully." }),
      request
    );
  } catch (error) {
    console.error("DELETE /resume error:", error);
    return withCors(
      NextResponse.json({ message: "Failed to delete resume." }, { status: 500 }),
      request
    );
  }
}