"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Edit, Trash2, Star, Building, Filter } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import ImageUploader from '@/components/custom/image-uploader'

// --- Interfaces and Constants ---
interface TestimonialDisplay {
  _id: string
  name: string
  role: string
  company: string
  image: string
  content: string
  rating: number
  relationship: RelationshipType
  project?: string
  featured: boolean
  status: StatusType
  createdAt: string
  updatedAt: string
}

interface TestimonialPayload {
  name: string
  role: string
  company: string
  image: string
  content: string
  rating: number
  relationship: RelationshipType
  project?: string
  featured?: boolean
  status?: StatusType
}

const relationships = [
  "supervisor",
  "mentor",
  "colleague",
  "client",
  "manager",
  "teamLead",
  "stakeholder",
  "partner",
] as const

const statuses = ["all", "draft", "published"] as const

type RelationshipType = typeof relationships[number]
type StatusType = Exclude<typeof statuses[number], "all">

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<typeof statuses[number]>("all")
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipType | "all">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialDisplay | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE) {
    throw new Error('API base URL is not configured.');
  }

  const [formData, setFormData] = useState<Omit<TestimonialPayload, 'project'> & { project: string }>({
    name: "",
    role: "",
    company: "",
    image: "",
    content: "",
    rating: 5,
    relationship: "client",
    project: "",
    featured: false,
    status: "published",
  })

  // Handle status change for filter
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as typeof statuses[number])
  }

  // Handle relationship change for filter
  const handleRelationshipChange = (value: string) => {
    setSelectedRelationship(value as RelationshipType | "all")
  }

  // Handle form status change
  const handleFormStatusChange = (value: string) => {
    setFormData({ ...formData, status: value as StatusType })
  }

  // Handle form relationship change
  const handleFormRelationshipChange = (value: string) => {
    setFormData({ ...formData, relationship: value as RelationshipType })
  }

  const fetchTestimonials = useCallback(async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append("search", searchTerm)
      if (selectedStatus !== "all") queryParams.append("status", selectedStatus)
      if (selectedRelationship !== "all") queryParams.append("relationship", selectedRelationship)

      const response = await fetch(`${API_BASE}/api/testimonials?${queryParams.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setTestimonials(result.data)
      } else {
        console.error("API response format error:", result)
        throw new Error("Unexpected API response format")
      }
    } catch (error) {
      let errorMessage = "Failed to load testimonials"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      setTestimonials([])
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, selectedStatus, selectedRelationship, toast, API_BASE])

  useEffect(() => {
    fetchTestimonials()
  }, [fetchTestimonials])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload: TestimonialPayload = {
      ...formData,
      project: formData.project || undefined,
    }

    try {
      const url = editingTestimonial
        ? `${API_BASE}/api/testimonials/${editingTestimonial._id}`
        : `${API_BASE}/api/testimonials`

      const response = await fetch(url, {
        method: editingTestimonial ? "PUT" : "POST",
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const responseData = await response.json()
        console.error("Backend validation errors:", responseData)
        throw new Error(
          responseData.error || 
          responseData.message || 
          (responseData.issues ? "Validation failed" : `HTTP error! status: ${response.status}`)
        )
      }

      toast({
        title: "Success",
        description: editingTestimonial ? "Testimonial updated" : "Testimonial created",
      })

      setIsDialogOpen(false)
      setEditingTestimonial(null)
      setFormData({
        name: "",
        role: "",
        company: "",
        image: "",
        content: "",
        rating: 5,
        relationship: "client",
        project: "",
        featured: false,
        status: "published",
      })
      fetchTestimonials()
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit testimonial",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return

    try {
      const response = await fetch(`${API_BASE}/api/testimonials/${id}`, {
        method: "DELETE",
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }

      toast({ title: "Success", description: "Testimonial deleted" })
      fetchTestimonials()
    } catch (error) {
      let errorMessage = "Failed to delete testimonial"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      company: "",
      image: "",
      content: "",
      rating: 5,
      relationship: "client",
      project: "",
      featured: false,
      status: "published",
    })
    setEditingTestimonial(null)
  }

  const handleEdit = (testimonial: TestimonialDisplay) => {
    setEditingTestimonial(testimonial)
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      company: testimonial.company,
      image: testimonial.image,
      content: testimonial.content,
      rating: testimonial.rating,
      relationship: testimonial.relationship,
      project: testimonial.project || "",
      featured: testimonial.featured,
      status: testimonial.status,
    })
    setIsDialogOpen(true)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-slate-600"}`} />
    ))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header and Add Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Testimonials</h1>
            <p className="text-slate-400">Manage client testimonials and reviews</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Testimonial
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-100">
                  {editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {editingTestimonial ? "Update testimonial details" : "Add a new client testimonial"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-slate-200">Role</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-200">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship" className="text-slate-200">Relationship</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={handleFormRelationshipChange}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {relationships.map((rel) => (
                          <SelectItem key={rel} value={rel} className="capitalize text-slate-100">
                            {rel.replace(/([A-Z])/g, ' $1').trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image" className="text-slate-200">Profile Image</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="project" className="text-slate-200">Project (Optional)</Label>
                  <Input
                    id="project"
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="e.g., 'E-commerce Platform'"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-slate-200">Testimonial Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating" className="text-slate-200">Rating</Label>
                    <Select
                      value={formData.rating.toString()}
                      onValueChange={(value) => setFormData({ ...formData, rating: Number(value) })}
                      required
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <SelectItem key={rating} value={rating.toString()} className="text-slate-100">
                            <div className="flex items-center space-x-2">
                              <span>{rating}</span>
                              <div className="flex">
                                {Array.from({ length: rating }, (_, i) => (
                                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label htmlFor="featured" className="text-slate-200">
                      Featured Testimonial
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-200">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleFormStatusChange}
                    required
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="published" className="text-slate-100">Published</SelectItem>
                      <SelectItem value="draft" className="text-slate-100">Draft</SelectItem>
                    </SelectContent>
                  </Select>
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
                    {editingTestimonial ? "Update" : "Create"} Testimonial
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search testimonials by name, company, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>
          <Select
            value={selectedRelationship}
            onValueChange={handleRelationshipChange}
          >
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-100">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Relationships" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-slate-100">All Relationships</SelectItem>
              {relationships.map((rel) => (
                <SelectItem key={rel} value={rel} className="capitalize text-slate-100">
                  {rel.replace(/([A-Z])/g, ' $1').trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedStatus}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-100">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {statuses.map((status) => (
                <SelectItem key={status} value={status} className="capitalize text-slate-100">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Testimonials Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {testimonials.length > 0 ? (
                testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={testimonial.image || "/placeholder.svg"}
                              alt={testimonial.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <CardTitle className="text-slate-100 text-lg">{testimonial.name}</CardTitle>
                              <CardDescription className="text-slate-400">
                                {testimonial.role} at {testimonial.company}
                              </CardDescription>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex">{renderStars(testimonial.rating)}</div>
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 capitalize">
                                  {testimonial.relationship.replace(/([A-Z])/g, ' $1').trim()}
                                </Badge>
                                <Badge variant={testimonial.status === "published" ? "default" : "secondary"} className="capitalize">
                                  {testimonial.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {testimonial.featured && <Badge className="bg-indigo-600 text-white">Featured</Badge>}
                        </div>
                      </CardHeader>

                      <CardContent>
                        {testimonial.project && (
                          <Badge variant="outline" className="mb-2 border-indigo-600 text-indigo-400">
                            Project: {testimonial.project}
                          </Badge>
                        )}
                        <blockquote className="text-slate-300 italic mb-4 line-clamp-4">"{testimonial.content}"</blockquote>

                        <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                          <span className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {testimonial.company}
                          </span>
                          {testimonial.createdAt && (
                            <span>{new Date(testimonial.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(testimonial)}
                            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(testimonial._id)}
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 text-center py-12">
                  <div className="text-slate-400 text-lg">No testimonials found</div>
                  <p className="text-slate-500 mt-2">Try adjusting your search terms or filters, or add a new testimonial</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!isLoading && testimonials.length === 0 && searchTerm === "" && selectedStatus === "all" && selectedRelationship === "all" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="text-slate-400 text-lg">No testimonials found</div>
            <p className="text-slate-500 mt-2">Try adjusting your search terms or filters, or add a new testimonial</p>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}