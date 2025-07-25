import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleOptions } from '@/lib/cors';
import { requireAdmin } from '@/lib/middleware/auth';
import { validateFile } from '@/lib/utils';
import { v2 as cloudinary } from 'cloudinary';

const UPLOADS_DIR = '/tmp'; // For Vercel/serverless compatibility
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
];

// Cloudinary config from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    let formData;
    try {
      formData = await request.formData();
    } catch (formErr) {
      return withCors(
        NextResponse.json({ message: 'Failed to parse form data.' }, { status: 400 }),
        request
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return withCors(
        NextResponse.json({ message: 'No file uploaded.' }, { status: 400 }),
        request
      );
    }

    // Use the new validation utility
    const validation = validateFile(file);
    if (!validation.valid) {
      return withCors(
        NextResponse.json({ message: validation.error }, { status: 400 }),
        request
      );
    }

    // Convert file to buffer
    let buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch (bufErr) {
      return withCors(
        NextResponse.json({ message: 'Failed to process uploaded file.' }, { status: 500 }),
        request
      );
    }

    // Upload to Cloudinary
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'portfolio_uploads',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(buffer);
      });
      // @ts-ignore
      const imageUrl = uploadResult.secure_url;
      return withCors(
        NextResponse.json({ url: imageUrl, message: 'Image uploaded successfully.' }, { status: 200 }),
        request
      );
    } catch (cloudErr) {
      return withCors(
        NextResponse.json({ message: 'Failed to upload image to Cloudinary.' }, { status: 500 }),
        request
      );
    }
  } catch (error) {
    return withCors(
      NextResponse.json({ message: 'Failed to upload image.' }, { status: 500 }),
      request
    );
  }
  });

export async function GET(request: NextRequest) {
  return withCors(
    NextResponse.json({ message: "Upload route active" }),
    request
  );
} 