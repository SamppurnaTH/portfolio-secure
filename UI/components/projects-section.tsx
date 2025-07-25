"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, Brain, Shield, Globe } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Dynamically resolved icon map based on category/type (optional enhancement)
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "AI/ML": Brain,
  "Cyber Security": Shield,
  "Web Development": Globe,
  "Healthcare AI": Brain, // Assuming Brain icon for Healthcare AI
}

const categoryColors: Record<string, string> = {
  "AI/ML": "from-purple-500 to-pink-500",
  "Healthcare AI": "from-green-500 to-emerald-500",
  "Cyber Security": "from-red-500 to-orange-500",
  "Web Development": "from-blue-500 to-cyan-500",
}

type Project = {
  _id: string
  title: string
  description: string
  image: string
  technologies: string[]
  category: string
  githubUrl: string
  liveUrl: string
  featured: boolean
  // Add other properties if you plan to use them from the API response
  // e.g., excerpt, tags, status, slug, createdAt, updatedAt, views, likes
}

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // Added error state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get API base URL from environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProjects = async () => {
      if (!API_BASE_URL) {
        console.error("NEXT_PUBLIC_API_URL is not defined.");
        setError("API base URL is not configured.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`); // <--- Updated API call

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const responseData = await res.json();
        // Check if data.success is true and data.data exists and is an array
        if (responseData.success && Array.isArray(responseData.data)) {
          setProjects(responseData.data); // <--- Access 'data' property
        } else {
          setProjects([]); // Set to empty array if no data or not successful
          console.warn("API response was successful but 'data' array was not found or was not an array:", responseData);
        }
      } catch (error: any) {
        console.error("Failed to fetch projects:", error)
        setError(`Failed to load projects: ${error.message}`);
        setProjects([]); // Clear projects on error
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [API_BASE_URL]) // Dependency array includes API_BASE_URL

  const handleLiveDemoClick = (project: Project) => {
    // Only open directly if it's a valid external URL
    if (project.liveUrl && project.liveUrl.startsWith("http")) {
      window.open(project.liveUrl, "_blank", "noopener,noreferrer")
    } else {
      // For placeholder/internal demos or when no liveUrl is provided
      setSelectedProject(project)
      setIsModalOpen(true)
    }
  }

  const handleCodeClick = (githubUrl: string) => {
    if (githubUrl && githubUrl !== "#") {
      window.open(githubUrl, "_blank", "noopener,noreferrer")
    } else {
      console.warn("GitHub link not available for this project.")
      // Optionally, show a toast or alert to the user
      alert("GitHub link is not available for this project yet!")
    }
  }

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
          <div className="text-center text-gray-400">Loading projects...</div>
        ) : error ? ( // Display error message if there's an error
          <div className="text-center text-red-400">Error: {error}</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-gray-400">No projects found.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => {
              const Icon = categoryIcons[project.category] || Globe
              const color = categoryColors[project.category] || "from-cyan-500 to-purple-500"

              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-500 overflow-hidden h-full">
                    <div className="relative overflow-hidden">
                      <img
                        // Use a fallback image if project.image is null or empty
                        src={project.image || "/placeholder.svg"} 
                        alt={project.title}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
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

                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 mb-4 leading-relaxed">{project.description}</p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 rounded text-xs text-purple-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all duration-300"
                          onClick={() => handleCodeClick(project.githubUrl)}
                          disabled={!project.githubUrl || project.githubUrl === '#'} // Disable if no valid URL
                        >
                          <Github className="mr-2 h-4 w-4" />
                          Code
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white transition-all duration-300"
                          onClick={() => handleLiveDemoClick(project)}
                          disabled={!project.liveUrl} // Disable if no live URL
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Live Demo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal for internal demo if needed */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              {selectedProject?.title} Demo
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="mt-4">
              {selectedProject.liveUrl && selectedProject.liveUrl.startsWith("http") ? (
                // Use a key to force remount of iframe when project changes
                <iframe
                  key={selectedProject._id} 
                  src={selectedProject.liveUrl}
                  className="w-full h-[500px] rounded-lg border border-slate-700"
                  title={`${selectedProject.title} Demo`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-slate-700 rounded-lg">
                  <p className="text-gray-400">No live demo content available for this project.</p>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900"
                  onClick={() => selectedProject?.liveUrl && window.open(selectedProject.liveUrl, "_blank")}
                  disabled={!selectedProject?.liveUrl || !selectedProject.liveUrl.startsWith("http")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}