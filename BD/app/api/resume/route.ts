import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { withCors, handleOptions } from "@/lib/cors";
import { authenticateRequest } from "@/lib/auth";

// Constants
// Use /tmp for serverless compatibility (Vercel, etc.)
const UPLOADS_DIR = "/tmp";
const RESUME_FILENAME = "VENU_THOTA.pdf";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ------------------------------------
// GET: Public resume download
// ------------------------------------
export async function GET(request: NextRequest) {
  try {
    await ensureUploadsDir();
    const resumePath = path.join(UPLOADS_DIR, RESUME_FILENAME);

    try {
      await fs.access(resumePath);
    } catch {
      return withCors(
        NextResponse.json({ message: "Resume not found." }, { status: 404 }),
        request
      );
    }

    const file = await fs.readFile(resumePath);
    const stats = await fs.stat(resumePath);

    const response = new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${RESUME_FILENAME}"`,
        "Content-Length": stats.size.toString(),
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
      await ensureUploadsDir();
    } catch (mkdirErr) {
      console.error("[RESUME UPLOAD] Error creating uploads dir:", mkdirErr);
      return withCors(
        NextResponse.json({ message: "Failed to create upload directory." }, { status: 500 }),
        request
      );
    }

    const tempPath = path.join(UPLOADS_DIR, `temp_${Date.now()}_${RESUME_FILENAME}`);
    try {
      await fs.writeFile(tempPath, buffer);
    } catch (writeErr) {
      console.error("[RESUME UPLOAD] Error writing file:", writeErr);
      return withCors(
        NextResponse.json({ message: "Failed to save uploaded file." }, { status: 500 }),
        request
      );
    }

    const resumePath = path.join(UPLOADS_DIR, RESUME_FILENAME);
    try {
      await fs.rename(tempPath, resumePath);
    } catch (renameErr) {
      console.error("[RESUME UPLOAD] Error renaming file:", renameErr);
      return withCors(
        NextResponse.json({ message: "Failed to finalize uploaded file." }, { status: 500 }),
        request
      );
    }

    const baseURL = request.nextUrl.origin || process.env.API_BASE_URL;
    if (!baseURL) {
      throw new Error('API_BASE_URL environment variable is not configured');
    }
    const resumeUrl = `${baseURL}/uploads/${RESUME_FILENAME}`;

    return withCors(
      NextResponse.json({
        message: "Resume uploaded successfully.",
        data: { url: resumeUrl }
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

    await ensureUploadsDir();
    const resumePath = path.join(UPLOADS_DIR, RESUME_FILENAME);

    try {
      await fs.access(resumePath);
    } catch {
      return withCors(
        NextResponse.json({ message: "Resume not found." }, { status: 404 }),
        request
      );
    }

    await fs.unlink(resumePath);
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