import { NextRequest, NextResponse } from "next/server";

// Read and split comma-separated origins from env
const ALLOWED_ORIGINS: string[] = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()).filter(o => o) || [];

export function withCors(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Vary", "Origin");

  return response;
}

export function handleOptions(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const response = new NextResponse(null, { status: 204 });

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin");

  return response;
}