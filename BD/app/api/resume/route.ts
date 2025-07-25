import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { withCors, handleOptions } from "@/lib/cors";
import { authenticateRequest } from "@/lib/auth";

const RESUME_FILENAME = "VENU_THOTA.pdf";
const RESUME_PATH = path.join(process.cwd(), "public", "uploads", RESUME_FILENAME);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    const fileBuffer = await fs.readFile(RESUME_PATH);
    
    // Create response and apply CORS
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${RESUME_FILENAME}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
    
    return withCors(response, request);
    
  } catch (error) {
    console.error("GET /resume error:", error);
    const errorResponse = new NextResponse(
      JSON.stringify({ message: "Resume not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
    return withCors(errorResponse, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate first
    const authResponse = await authenticateRequest(request);
    if (authResponse instanceof NextResponse) {
      return withCors(authResponse, request);
    }

    // Process file upload
    let formData;
    try {
      formData = await request.formData();
    } catch (err) {
      console.error("[UPLOAD] Error parsing form data:", err);
      return withCors(
        NextResponse.json({ message: "Invalid form data." }, { status: 400 }),
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

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await fs.mkdir(path.dirname(RESUME_PATH), { recursive: true });
      await fs.writeFile(RESUME_PATH, buffer);
    } catch (writeErr) {
      console.error("[UPLOAD] Failed to save file locally:", writeErr);
      return withCors(
        NextResponse.json({ message: "Failed to save resume." }, { status: 500 }),
        request
      );
    }

    const successResponse = NextResponse.json({
      message: "Resume uploaded successfully.",
      data: { url: `${request.nextUrl.origin}/uploads/${RESUME_FILENAME}` },
    });
    
    return withCors(successResponse, request);
    
  } catch (error) {
    console.error("POST /resume error:", error);
    return withCors(
      NextResponse.json({ message: "Internal server error." }, { status: 500 }),
      request
    );
  }
}