"use client"

import { useEffect, useState } from 'react';

interface Project {
  _id: string;
  title: string;
  description: string;
  views: number;
}

interface ProjectDetailClientProps {
  id: string;
}

export default function ProjectDetailClient({ id }: ProjectDetailClientProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL;
    if (!API_BASE) {
      throw new Error('API base URL is not configured.');
    }

    const fetchProjectAndIncrementView = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/projects/${id}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Failed to fetch project: ${errorData.message || res.statusText}`);
        }
        const { data } = await res.json();
        setProject(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Increment view count when the project is viewed
    const incrementView = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/projects/${id}/view`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Failed to increment view:", data.error || res.statusText);
        } else {
          console.log("Increment view response:", data);
        }
      } catch (err) {
        console.error("Error incrementing view:", err);
      }
    };

    if (id) {
      fetchProjectAndIncrementView();
      incrementView();
    }
  }, [id]);

  if (loading) return <div className="text-center py-8">Loading project...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!project) return <div className="text-center py-8">Project not found.</div>;

  return (
    <div className="container mx-auto p-4 py-12">
      <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
      <p className="text-gray-600 mb-6">Views: {project.views}</p>
      <p>{project.description}</p>
    </div>
  );
} 