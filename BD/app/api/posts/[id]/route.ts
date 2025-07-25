import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb"; // ObjectId is imported, assuming it's from 'mongodb'
import { getDatabase } from "@/lib/mongodb";
import {
  requireAdmin,
  AuthenticatedRequest,
  NextRouteContext,
} from "@/lib/middleware/auth";
import { postSchema } from "@/lib/validation";
import type { Post } from "@/lib/models/Post";
import { withCors, handleOptions } from "@/lib/cors";

// Helper to extract ID or slug from params
const extractId = (params: { [key: string]: string | string[] }) => {
  const id = params.id;
  return Array.isArray(id) ? id[0] : id;
};

// ----------------------------------------------
// GET - Fetch a single post (public) and increment view count
// ----------------------------------------------
export async function GET(request: NextRequest, context: NextRouteContext) {
  try {
    const { params } = context;
    const id = extractId(params);

    if (!id) {
      return withCors(
        NextResponse.json({ error: "Missing post ID or slug" }, { status: 400 }),
        request
      );
    }

    const db = await getDatabase();
    const postsCollection = db.collection<Post>("posts");

    const query: any = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { slug: id }] }
      : { slug: id };

    // Find the post and increment its views in one operation.
    // We assume findOneAndUpdate directly returns the updated document or null here.
    const updatedPost = await postsCollection.findOneAndUpdate(
      query,
      { $inc: { views: 1 } },
      { returnDocument: 'after' } // This option instructs MongoDB to return the modified document
    );

    // Check if the post was found and updated
    // updatedPost will be null if no document matched the query
    if (!updatedPost) { // Check if updatedPost is null
      return withCors(
        NextResponse.json({ error: "Post not found" }, { status: 404 }),
        request
      );
    }

    // Return the post with the incremented view count
    // If updatedPost is not null, it's guaranteed to be a Post document here by TypeScript
    return withCors(
      NextResponse.json({ success: true, data: updatedPost }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      request
    );
  }
}

// ----------------------------------------------
// PUT - Update a post (admin only)
// ----------------------------------------------
export const PUT = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid or missing post ID" }, { status: 400 }),
          request
        );
      }

      const body = await request.json();
      const validation = postSchema.safeParse(body);

      if (!validation.success) {
        return withCors(
          NextResponse.json(
            {
              error: "Validation failed",
              issues: validation.error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
            { status: 400 }
          ),
          request
        );
      }

      const validatedData = validation.data;
      const slug = validatedData.title.trim().toLowerCase().replace(/\s+/g, "-");

      const db = await getDatabase();
      const postsCollection = db.collection<Post>("posts");

      // Check for slug collision
      const duplicate = await postsCollection.findOne({
        slug,
        _id: { $ne: new ObjectId(id) },
      });

      if (duplicate) {
        return withCors(
          NextResponse.json({ error: "Slug already exists" }, { status: 400 }),
          request
        );
      }

      const result = await postsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...validatedData,
            slug,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Post not found" }, { status: 404 }),
          request
        );
      }

      const updatedPost = await postsCollection.findOne({ _id: new ObjectId(id) });

      return withCors(
        NextResponse.json({ success: true, data: updatedPost }),
        request
      );
    } catch (error) {
      return withCors(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        request
      );
    }
  }
);

// ----------------------------------------------
// DELETE - Delete a post (admin only)
// ----------------------------------------------
export const DELETE = requireAdmin(
  async (request: AuthenticatedRequest, context: NextRouteContext) => {
    try {
      const { params } = context;
      const id = extractId(params);

      if (!id || !ObjectId.isValid(id)) {
        return withCors(
          NextResponse.json({ error: "Invalid or missing post ID" }, { status: 400 }),
          request
        );
      }

      const db = await getDatabase();
      const postsCollection = db.collection<Post>("posts");

      const result = await postsCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return withCors(
          NextResponse.json({ error: "Post not found" }, { status: 404 }),
          request
        );
      }

      return withCors(
        NextResponse.json({ success: true, message: "Post deleted successfully" }),
        request
      );
    } catch (error) {
      return withCors(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        request
      );
    }
  }
);

// ----------------------------------------------
// OPTIONS - CORS Preflight
// ----------------------------------------------
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}