import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }
  const db = await getDatabase();
  const posts = db.collection("posts");
  const result = await posts.updateOne(
    { _id: new ObjectId(id) },
    { $inc: { views: 1 } }
  );
  if (result.modifiedCount === 1) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
} 