"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react"
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
import { AdminLayout } from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation" // Import useRouter for redirection

interface Experience {
  _id: string
  company: string
  position: string
  location: string
  description: string
  startDate: string
  endDate: string
  technologies: string[]
  logo: string
  currentlyWorking: boolean
}

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter() // Initialize useRouter

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    location: "",
    description: "",
    startDate: "",
    endDate: "",
    technologies: "",
    logo: "🏢",
    currentlyWorking: false
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE) {
    throw new Error('API base URL is not configured.');
  }

  const fetchExperiences = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/experience`, {
        credentials: 'include'
      })

      if (response.status === 401) { // Handle 401 specifically for expired tokens etc.
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        })
        localStorage.removeItem("token") // Clear invalid token
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()

      const data = Array.isArray(result) ? result : (result.data || [])

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from API")
      }

      setExperiences(data)
    } catch (error) {
      console.error("Error fetching experiences:", error)
      setExperiences([]) // Clear experiences on error
      toast({
        title: "Failed to load experiences",
        description: "There was an error fetching the data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [API_BASE, toast, router])

  useEffect(() => {
    fetchExperiences()
  }, [fetchExperiences])

  const filteredExperiences = (experiences || []).filter((exp) => {
    const search = searchTerm.toLowerCase()
    return (
      exp?.company?.toLowerCase().includes(search) ||
      exp?.position?.toLowerCase().includes(search) ||
      exp?.technologies?.some(tech => tech.toLowerCase().includes(search))
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let response: Response
      const experienceData = {
        company: formData.company,
        position: formData.position,
        location: formData.location,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.currentlyWorking ? "" : formData.endDate,
        technologies: formData.technologies.split(",").map(tech => tech.trim()),
        logo: formData.logo,
        currentlyWorking: formData.currentlyWorking
      }

      if (editingExperience) {
        response = await fetch(`${API_BASE}/api/experience/${editingExperience._id}`, {
          method: "PUT",
          credentials: 'include',
          body: JSON.stringify(experienceData)
        })
      } else {
        response = await fetch(`${API_BASE}/api/experience`, {
          method: "POST",
          credentials: 'include',
          body: JSON.stringify(experienceData)
        })
      }

      if (response.status === 401) { // Handle 401 specifically
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        })
        localStorage.removeItem("authToken")
        router.push("/login")
        return
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({ title: `Experience ${editingExperience ? "updated" : "added"} successfully` }) // More specific toast
      setIsDialogOpen(false)
      resetForm()
      fetchExperiences()
    } catch (error: any) {
      console.error("Error submitting experience:", error)
      toast({
        title: `Failed to ${editingExperience ? "update" : "add"} experience`,
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      company: "",
      position: "",
      location: "",
      description: "",
      startDate: "",
      endDate: "",
      technologies: "",
      logo: "🏢",
      currentlyWorking: false
    })
    setEditingExperience(null)
  }

  const handleEdit = (experience: Experience) => {
    setEditingExperience(experience)
    setFormData({
      company: experience.company,
      position: experience.position,
      location: experience.location,
      description: experience.description,
      startDate: experience.startDate,
      endDate: experience.currentlyWorking ? "" : experience.endDate,
      technologies: experience.technologies.join(", "),
      logo: experience.logo,
      currentlyWorking: experience.currentlyWorking
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this experience?")) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/experience/${id}`, {
        method: "DELETE",
        credentials: 'include'
      })

      if (response.status === 401) { // Handle 401 specifically
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        })
        localStorage.removeItem("token")
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({ title: "Experience deleted successfully" })
      fetchExperiences()
    } catch (error) {
      console.error("Error deleting experience:", error)
      toast({
        title: "Failed to delete experience",
        description: "There was an error deleting the experience.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Present"
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  if (loading) {
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Work Experience</h1>
            <p className="text-slate-400">Manage your professional work history</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-100">
                  {editingExperience ? "Edit Experience" : "Add New Experience"}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {editingExperience ? "Update work experience details" : "Add a new professional experience"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-200">
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-slate-200">
                      Position
                    </Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-slate-200">
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="e.g., Remote, On-Site (City)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo" className="text-slate-200">
                      Logo Emoji
                    </Label>
                    <Input
                      id="logo"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      maxLength={2}
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
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-slate-200">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-slate-200">
                      End Date
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-slate-100"
                        disabled={formData.currentlyWorking}
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="currentlyWorking"
                          aria-label="Currently working at this position"
                          checked={formData.currentlyWorking}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              currentlyWorking: e.target.checked,
                              endDate: e.target.checked ? "" : formData.endDate
                            })
                          }}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor="currentlyWorking" className="text-slate-200">
                          Currently Working
                        </Label>
                      </div>
                    </div>
                  </div>
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
                    placeholder="Python, React, Node.js, etc."
                  />
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
                    {editingExperience ? "Update" : "Add"} Experience
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search experiences..."
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

        <div className="space-y-6">
          <AnimatePresence>
            {filteredExperiences.map((experience, index) => (
              <motion.div
                key={experience._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="text-3xl p-3 rounded-lg bg-slate-700/50">
                        {experience.logo}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <CardTitle className="text-slate-100 text-lg">
                              {experience.position}
                            </CardTitle>
                            <CardDescription className="text-slate-300">
                              {experience.company} • {experience.location}
                            </CardDescription>
                          </div>
                          <div className="text-slate-400 text-sm">
                            {formatDate(experience.startDate)} - {formatDate(experience.endDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-slate-300 text-sm whitespace-pre-line">
                        {experience.description}
                      </p>

                      {experience.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {experience.technologies.map(tech => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(experience)}
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(experience._id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredExperiences.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="text-slate-400 text-lg">No experiences found</div>
            <p className="text-slate-500 mt-2">Try adjusting your search terms</p>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}