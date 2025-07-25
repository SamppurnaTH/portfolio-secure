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

// ------------------------------------
// GET: Serve resume from local file system
// ------------------------------------
export async function GET(request: NextRequest) {
  try {
    const fileBuffer = await fs.readFile(RESUME_PATH);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${RESUME_FILENAME}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET /resume error:", error);
    return new NextResponse(
      JSON.stringify({ message: "Resume not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ------------------------------------
// POST: Upload resume to local file system
// ------------------------------------
export async function POST(request: NextRequest) {
  try {
    const authResponse = await authenticateRequest(request);
    if (authResponse instanceof NextResponse) return authResponse;

    let formData;
    try {
      formData = await request.formData();
    } catch (err) {
      console.error("[UPLOAD] Error parsing form data:", err);
      return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
    }

    const file = (formData.get("file") || formData.get("resume")) as File | null;
    if (!file) {
      return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ message: "Only PDF files are allowed." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await fs.mkdir(path.dirname(RESUME_PATH), { recursive: true });
      await fs.writeFile(RESUME_PATH, buffer);
    } catch (writeErr) {
      console.error("[UPLOAD] Failed to save file locally:", writeErr);
      return NextResponse.json({ message: "Failed to save resume." }, { status: 500 });
    }

    const resumeUrl = `${request.nextUrl.origin}/uploads/${RESUME_FILENAME}`;

    return NextResponse.json({
      message: "Resume uploaded successfully.",
      data: { url: resumeUrl },
    });
  } catch (error) {
    console.error("POST /resume error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
