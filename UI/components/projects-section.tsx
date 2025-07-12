"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Brain, Shield, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "AI/ML": Brain,
  "Cyber Security": Shield,
  "Web Development": Globe,
  "Healthcare AI": Brain,
};

const categoryColors: Record<string, string> = {
  "AI/ML": "from-purple-500 to-pink-500",
  "Healthcare AI": "from-green-500 to-emerald-500",
  "Cyber Security": "from-red-500 to-orange-500",
  "Web Development": "from-blue-500 to-cyan-500",
};

type Project = {
  _id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  category: string;
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Using NEXT_PUBLIC_API_URL from your environment
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://portfolio-api-seven-mu.vercel.app";

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`, {
          headers: {
            'Content-Type': 'application/json',
            // Add authorization if needed
            // 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
          },
          next: { revalidate: 3600 } // Revalidate data every hour
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `Failed to fetch projects (${res.status} ${res.statusText})`
          );
        }

        const { data, success } = await res.json();
        
        if (success && Array.isArray(data)) {
          // Transform image URLs to use Cloudinary if needed
          const transformedProjects = data.map((project: Project) => ({
            ...project,
            image: project.image?.startsWith('http') ? 
              project.image : 
              `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${project.image}`
          }));
          
          setProjects(transformedProjects);
        } else {
          throw new Error("Invalid data format received from server");
        }
      } catch (err: any) {
        console.error("Fetch projects error:", err);
        setError(err.message || "Failed to load projects. Please try again later.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [API_BASE_URL]);

  // Sort projects with featured ones first, then by creation date
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleLiveDemoClick = (project: Project) => {
    if (project.liveUrl && isValidUrl(project.liveUrl)) {
      window.open(project.liveUrl, "_blank", "noopener,noreferrer");
    } else {
      setSelectedProject(project);
      setIsModalOpen(true);
    }
  };

  const handleCodeClick = (githubUrl: string) => {
    if (githubUrl && isValidUrl(githubUrl)) {
      window.open(githubUrl, "_blank", "noopener,noreferrer");
    } else {
      alert("GitHub link is not available for this project yet!");
    }
  };

  // Helper function to validate URLs
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <section className="py-20 relative" id="projects">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Featured Projects
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Showcasing innovative solutions in AI/ML, Cyber Security, and Web Development
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-gray-400">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="text-cyan-400 border-cyan-400"
            >
              Retry
            </Button>
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No projects found.</p>
            <p className="text-sm text-gray-500 mt-2">Check back later for updates</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedProjects.map((project, index) => {
              const Icon = categoryIcons[project.category] || Globe;
              const color = categoryColors[project.category] || "from-cyan-500 to-purple-500";

              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-500 overflow-hidden h-full flex flex-col">
                    {project.featured && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                          Featured
                        </span>
                      </div>
                    )}
                    <div className="relative overflow-hidden flex-grow-0">
                      <img
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                      <div className="absolute top-4 right-4">
                        <div className={`p-2 rounded-full bg-gradient-to-r ${color} shadow-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-sm rounded-full text-sm text-cyan-300 border border-cyan-400/30">
                          {project.category}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-grow">
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                          {project.title}
                        </h3>
                        <p className="text-gray-400 mb-4 leading-relaxed line-clamp-3">
                          {project.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                          {project.technologies.slice(0, 5).map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 rounded text-xs text-purple-300"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 5 && (
                            <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-gray-400">
                              +{project.technologies.length - 5}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all duration-300"
                          onClick={() => handleCodeClick(project.githubUrl)}
                          disabled={!project.githubUrl || !isValidUrl(project.githubUrl)}
                        >
                          <Github className="mr-2 h-4 w-4" />
                          Code
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white transition-all duration-300"
                          onClick={() => handleLiveDemoClick(project)}
                          disabled={!project.liveUrl || !isValidUrl(project.liveUrl)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Live Demo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              {selectedProject?.title} Demo
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="mt-4">
              {selectedProject.liveUrl && isValidUrl(selectedProject.liveUrl) ? (
                <iframe
                  key={selectedProject._id}
                  src={selectedProject.liveUrl}
                  className="w-full h-[500px] rounded-lg border border-slate-700"
                  title={`${selectedProject.title} Demo`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-slate-700 rounded-lg p-4">
                  <p className="text-gray-400 mb-4">No live demo content available for this project.</p>
                  {selectedProject.description && (
                    <p className="text-gray-300 text-center">{selectedProject.description}</p>
                  )}
                </div>
              )}
              <div className="mt-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </Button>
                {selectedProject.liveUrl && isValidUrl(selectedProject.liveUrl) && (
                  <Button
                    variant="outline"
                    className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900"
                    onClick={() => window.open(selectedProject.liveUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}