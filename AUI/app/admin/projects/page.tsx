"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Filter, Edit, Trash2, Eye, Star, ExternalLink, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-toast"
import ImageUploader from '@/components/custom/image-uploader'

interface Project {
  id?: string
  _id?: string // Keep _id for backend response handling
  title: string
  description: string
  excerpt?: string
  image: string
  tags: string[]
  technologies?: string[]
  category?: string
  featured: boolean
  likes: number
  views: number
  githubUrl?: string
  liveUrl?: string
  slug: string
  status?: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { id: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<(Project & { id: string }) | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    excerpt: "",
    image: "",
    tags: "",
    technologies: "",
    category: "",
    featured: false,
    githubUrl: "",
    liveUrl: "",
    status: "published"
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE) {
    throw new Error('API base URL is not configured.');
  }

  // Helper function to ensure all projects have a valid ID
  const ensureProjectId = (project: Project): Project & { id: string } => {
    if (project.id) return { ...project, id: project.id }
    if (project._id) return { ...project, id: project._id }
    return {
      ...project,
      id: `fallback-${project.slug || project.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    }
  }

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true); // Ensure loading state is set at the very beginning
      try {
        const url = `${API_BASE}/api/projects`
        const response = await fetch(url, { credentials: 'include' })

        if (!response.ok) {
          // Attempt to read response body as text first, then try JSON
          const errorBodyText = await response.text()
          let errorDetails = errorBodyText
          try {
            const errorJson = JSON.parse(errorBodyText)
            errorDetails = errorJson.message || JSON.stringify(errorJson)
          } catch (e) {
            // If it's not JSON, the raw text is fine
          }
          throw new Error(`Failed to fetch projects: ${response.status} - ${errorDetails}`)
        }

        // FIX START: Correctly access the 'data' array from the response object
        const responseBody: { success: boolean, data: Project[] } = await response.json()
        
        if (!responseBody.success || !Array.isArray(responseBody.data)) {
          throw new Error("API response was not successful or data is not an array.")
        }

        const data: Project[] = responseBody.data // Access the actual array

        const validatedProjects = data.map((project: Project) => ensureProjectId(project))
        setProjects(validatedProjects)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'An unknown error occurred during fetch',
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [toast, API_BASE])

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive"
      })
      return
    }

    const projectData = {
      ...formData,
      tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      technologies: formData.technologies.split(",").map((tech) => tech.trim()).filter(Boolean),
      slug: formData.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
      ...(editingProject ? {} : { views: 0, likes: 0 })
    }

    try {
      let response
      let responseData: { success: boolean, data: Project } | { success: boolean, message: string }

      const url = editingProject ? `${API_BASE}/api/projects/${editingProject.id}` : `${API_BASE}/api/projects`
      const method = editingProject ? 'PUT' : 'POST'

      response = await fetch(url, {
        method: method,
        credentials: 'include',
        body: JSON.stringify(projectData)
      })

      responseData = await response.json()

      if (!response.ok || !responseData.success) {
        const errorMessage = (responseData as { message?: string }).message || 'An unknown error occurred.'
        throw new Error(errorMessage)
      }

      const successData = responseData as { success: boolean, data: Project }
      const returnedProject = successData.data
      const validatedProject = ensureProjectId(returnedProject)

      if (editingProject) {
        setProjects(projects.map(p => p.id === editingProject.id ? validatedProject : p))
        toast({ title: "Project updated successfully" })
      } else {
        setProjects([...projects, validatedProject])
        toast({ title: "Project created successfully" })
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      excerpt: "",
      image: "",
      tags: "",
      technologies: "",
      category: "",
      featured: false,
      githubUrl: "",
      liveUrl: "",
      status: "published"
    })
    setEditingProject(null)
  }

  const handleEdit = (project: Project & { id: string }) => {
    setEditingProject(project)
    setFormData({
      title: project.title,
      description: project.description,
      excerpt: project.excerpt || "",
      image: project.image,
      tags: project.tags?.join(", ") || "",
      technologies: project.technologies?.join(", ") || "",
      category: project.category || "",
      featured: project.featured,
      githubUrl: project.githubUrl || "",
      liveUrl: project.liveUrl || "",
      status: project.status || "published"
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const url = `${API_BASE}/api/projects/${id}`

      const response = await fetch(url, { method: 'DELETE', credentials: 'include' })

      const responseData: { success: boolean, message: string } = await response.json()

      if (!response.ok || !responseData.success) {
        const errorMessage = responseData.message || 'An unknown error occurred.'
        throw new Error(errorMessage)
      }

      setProjects(projects.filter((p) => p.id !== id))
      toast({ title: "Project deleted successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Projects</h1>
            <p className="text-slate-400">Manage your portfolio projects</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-100">
                  {editingProject ? "Edit Project" : "Add New Project"}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {editingProject ? "Update project details" : "Create a new project for your portfolio"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-200">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image" className="text-slate-200">
                      Project Image
                    </Label>
                    <ImageUploader
                      initialImage={formData.image}
                      onUpload={async (file) => {
                        const formDataObj = new FormData();
                        formDataObj.append('file', file);
                        const res = await fetch(`${API_BASE}/api/upload`, {
                          method: 'POST',
                          credentials: 'include',
                          body: formDataObj,
                        });
                        if (!res.ok) {
                          toast({ title: 'Image upload failed', description: 'Could not upload image', variant: 'destructive' });
                          return;
                        }
                        const data = await res.json();
                        if (data?.url) {
                          setFormData((prev) => ({ ...prev, image: data.url }));
                        } else {
                          toast({ title: 'Image upload failed', description: 'No URL returned', variant: 'destructive' });
                        }
                      }}
                      onRemove={() => setFormData((prev) => ({ ...prev, image: '' }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-200">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-slate-200">
                    Excerpt (Short Description)
                  </Label>
                  <Input
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-slate-200">
                      Tags (comma separated)
                    </Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="nextjs, portfolio, tailwind"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technologies" className="text-slate-200">
                      Technologies (comma separated)
                    </Label>
                    <Input
                      id="technologies"
                      value={formData.technologies}
                      onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="Next.js, React, Tailwind CSS"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl" className="text-slate-200">
                      GitHub URL
                    </Label>
                    <Input
                      id="githubUrl"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liveUrl" className="text-slate-200">
                      Live URL
                    </Label>
                    <Input
                      id="liveUrl"
                      value={formData.liveUrl}
                      onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="https://project.example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-slate-200">
                      Category
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="Web Development"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label htmlFor="featured" className="text-slate-200">
                      Featured Project
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    {editingProject ? "Update" : "Create"} Project
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                key={`project-${project.id}`} // Use project.id for key
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 overflow-hidden">
                  <div className="relative">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                    />
                    {project.featured && (
                      <Badge className="absolute top-2 left-2 bg-indigo-600">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        {project.githubUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            aria-label={`View ${project.title} on GitHub`}
                          >
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="View GitHub repository"
                              title="View GitHub repository"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {project.liveUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            aria-label={`View ${project.title} live demo`}
                          >
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="View live project"
                              title="View live project"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-slate-100 text-lg">{project.title}</CardTitle>
                    <CardDescription className="text-slate-400 line-clamp-2">
                      {project.excerpt || project.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tags?.map((tag) => (
                        <Badge key={`tag-${tag}-${project.id}`} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {project.views}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {project.likes}
                        </span>
                      </div>
                      {project.category && (
                        <Badge variant="outline" className="text-xs">
                          {project.category}
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(project)}
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => project.id && handleDelete(project.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProjects.length === 0 && !isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="text-slate-400 text-lg">No projects found</div>
            <p className="text-slate-500 mt-2">Try adjusting your search terms</p>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}
