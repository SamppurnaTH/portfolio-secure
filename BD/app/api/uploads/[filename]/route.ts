import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOADS_DIR = '/tmp';
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  const ext = filename.split('.').pop()?.toLowerCase();
  const contentType = ext && ALLOWED_IMAGE_TYPES[ext];

  if (!contentType) {
    return new NextResponse('File type not allowed', { status: 400 });
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new NextResponse('File not found', { status: 404 });
  }
} 