"use client"

import { useEffect, useState } from 'react';

interface Post {
  _id: string;
  title: string;
  content: string;
  views: number;
}

interface BlogPostClientProps {
  slug: string;
}

export default function BlogPostClient({ slug }: BlogPostClientProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL;
    if (!API_BASE) {
      throw new Error('API base URL is not configured.');
    }

    const fetchPostAndIncrementView = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/posts/${slug}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Failed to fetch post: ${errorData.message || res.statusText}`);
        }
        const { data } = await res.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Increment view count when the blog post is viewed
    const incrementView = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/${post?._id}/view`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Failed to increment blog post view:", data.error || res.statusText);
        } else {
          console.log("Increment blog post view response:", data);
        }
      } catch (err) {
        console.error("Error incrementing blog post view:", err);
      }
    };

    if (slug) {
      fetchPostAndIncrementView();
    }
  }, [slug]);

  // Increment view after post is loaded
  useEffect(() => {
    if (post?._id) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL;
      if (!API_BASE) {
        throw new Error('API base URL is not configured.');
      }
      const incrementView = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/posts/${post._id}/view`, { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.error("Failed to increment blog post view:", data.error || res.statusText);
          } else {
            console.log("Increment blog post view response:", data);
          }
        } catch (err) {
          console.error("Error incrementing blog post view:", err);
        }
      };
      incrementView();
    }
  }, [post?._id]);

  if (loading) return <div className="text-center py-8">Loading blog post...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!post) return <div className="text-center py-8">Blog post not found.</div>;

  return (
    <div className="container mx-auto p-4 py-12">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-600 mb-6">Views: {post.views}</p>
      <div className="prose lg:prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: post.content }}></div>
    </div>
  );
} 