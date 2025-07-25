import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod"; // ✅ Zod needed for validation error detection

import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/middleware/auth";
import { postSchema } from "@/lib/validation";
import { generateSlug } from "@/lib/auth";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { Post } from "@/lib/models/Post";
import { withCors, handleOptions } from "@/lib/cors";

// ---------------------------------------
// OPTIONS - Handle CORS preflight
// ---------------------------------------
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

// ---------------------------------------
// GET - Fetch all blog posts (public)
// ---------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const status = searchParams.get("status") || "published";
    const search = searchParams.get("search");

    const db = await getDatabase();
    const postsCollection = db.collection<Post>("posts");

    const query: Record<string, any> = {};

    if (status !== "all") query.status = status;
    if (category && category !== "all") query.category = category;
    if (featured === "true") query.featured = true;

    if (search) {
      const sanitizedSearch = sanitizeSearchTerm(search);
      if (sanitizedSearch) {
      query.$or = [
          { title: { $regex: sanitizedSearch, $options: "i" } },
          { content: { $regex: sanitizedSearch, $options: "i" } },
          { tags: { $in: [new RegExp(sanitizedSearch, "i")] } },
      ];
      }
    }

    const posts = await postsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return withCors(
      NextResponse.json({ success: true, data: posts }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      ),
      request
    );
  }
}

// ---------------------------------------
// POST - Add a new blog post (admin only)
// ---------------------------------------
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = postSchema.parse(body);

    const db = await getDatabase();
    const postsCollection = db.collection<Post>("posts");

    const slug = generateSlug(validatedData.title);

    const existing = await postsCollection.findOne({ slug });
    if (existing) {
      return withCors(
        NextResponse.json(
          { success: false, error: "Post with this title already exists" },
          { status: 400 }
        ),
        request
      );
    }

    const now = new Date();

    const newPost: Post = {
      ...validatedData,
      slug,
      featured: validatedData.featured ?? false,
      status: validatedData.status ?? "draft",
      createdAt: now,
      updatedAt: now,
      views: 0,
      likes: 0,
      comments: 0,
    };

    const result = await postsCollection.insertOne(newPost);

    return withCors(
      NextResponse.json(
        {
          success: true,
          data: { ...newPost, _id: result.insertedId },
        },
        { status: 201 }
      ),
      request
    );
  } catch (err: unknown) {
    const error = err as any;

    if (error instanceof z.ZodError) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Validation Error",
            errors: error.errors,
          },
          { status: 400 }
        ),
        request
      );
    }

    return withCors(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      ),
      request
    );
  }
});
