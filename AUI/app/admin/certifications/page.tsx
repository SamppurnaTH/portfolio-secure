"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Filter, Edit, Trash2, ExternalLink } from "lucide-react"
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

interface Certification {
  _id: string
  title: string
  organization: string
  issueDate: string
  description: string
  badge: string
  color: string
  credentialId: string
  link: string
}

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    issueDate: "",
    description: "",
    badge: "",
    color: "from-blue-500 to-cyan-500",
    credentialId: "",
    link: ""
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  if (!API_BASE) {
    throw new Error('API base URL is not configured.');
  }

  const fetchCertifications = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch(`${API_BASE}/api/certifications`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const certificationsArray = Array.isArray(data) ? data : (data?.data || [])

      if (!Array.isArray(certificationsArray)) {
        throw new Error("Invalid data format received from API")
      }

      setCertifications(certificationsArray)
    } catch (error) {
      console.error("Error fetching certifications:", error)
      setCertifications([]) // Clear certifications on error
      toast({
        title: "Failed to load certifications",
        description: error instanceof Error ? error.message : "There was an error fetching the data. You might not be authorized.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [API_BASE, toast])

  useEffect(() => {
    fetchCertifications()
  }, [fetchCertifications])

  const filteredCertifications = (certifications || []).filter((cert) => {
    const search = searchTerm.toLowerCase()
    return (
      cert?.title?.toLowerCase().includes(search) ||
      cert?.organization?.toLowerCase().includes(search) ||
      (cert?.credentialId && cert.credentialId.toLowerCase().includes(search))
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let response: Response
      const certificationData = {
        title: formData.title,
        organization: formData.organization,
        issueDate: formData.issueDate,
        description: formData.description,
        badge: formData.badge,
        color: formData.color,
        credentialId: formData.credentialId,
        link: formData.link
      }

      console.log("Frontend sending data:", certificationData);

      if (editingCertification) {
        response = await fetch(`${API_BASE}/api/certifications/${editingCertification._id}`, {
          method: "PUT",
          credentials: 'include',
          body: JSON.stringify(certificationData)
        })

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        toast({ title: "Certification updated successfully" })
      } else {
        response = await fetch(`${API_BASE}/api/certifications`, {
          method: "POST",
          credentials: 'include',
          body: JSON.stringify(certificationData)
        })

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const validationMessages = errorData.errors.map((err: any) => `${err.path.join('.')} ${err.message}`).join(', ');
            throw new Error(`Validation Error: ${validationMessages}`);
          }
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        toast({ title: "Certification added successfully" })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchCertifications()
    } catch (error: any) {
      console.error("Error submitting certification:", error)
      toast({
        title: `Failed to ${editingCertification ? "update" : "add"} certification`,
        description: error.message || "Please try again. Check your authorization.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      organization: "",
      issueDate: "",
      description: "",
      badge: "",
      color: "from-blue-500 to-cyan-500",
      credentialId: "",
      link: ""
    })
    setEditingCertification(null)
  }

  const handleEdit = (certification: Certification) => {
    setEditingCertification(certification)
    setFormData({
      title: certification.title,
      organization: certification.organization,
      issueDate: certification.issueDate,
      description: certification.description || "",
      badge: certification.badge,
      color: certification.color,
      credentialId: certification.credentialId || "",
      link: certification.link || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this certification?")) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/certifications/${id}`, {
        method: "DELETE",
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({ title: "Certification deleted successfully" })
      fetchCertifications()
    } catch (error) {
      console.error("Error deleting certification:", error)
      toast({
        title: "Failed to delete certification",
        description: error instanceof Error ? error.message : "There was an error deleting the certification.",
        variant: "destructive",
      })
    }
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Certifications</h1>
            <p className="text-slate-400">Manage your professional certifications</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-100">
                  {editingCertification ? "Edit Certification" : "Add New Certification"}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {editingCertification ? "Update certification details" : "Add a new professional certification"}
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
                      title="Enter the title of the certification"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-slate-200">
                      Organization
                    </Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      required
                      title="Enter the issuing organization"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="text-slate-200">
                      Issue Date
                    </Label>
                    <Input
                      id="issueDate"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="YYYY or MM/YYYY"
                      required
                      title="Enter the issue date (e.g., YYYY or MM/YYYY)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credentialId" className="text-slate-200">
                      Credential ID
                    </Label>
                    <Input
                      id="credentialId"
                      value={formData.credentialId}
                      onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      title="Enter the credential ID (optional)"
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
                    title="Enter a description for the certification (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="badge" className="text-slate-200">
                      Badge Emoji
                    </Label>
                    <Input
                      id="badge"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="🛡️"
                      maxLength={2}
                      required
                      title="Enter a badge emoji (e.g., 🛡️)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-slate-200">
                      Gradient Color
                    </Label>
                    <select
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100 rounded-md px-3 py-2 w-full"
                      aria-label="Select gradient color combination"
                      title="Select a gradient color combination for the badge"
                      required
                    >
                      <option value="from-blue-500 to-cyan-500">Blue/Cyan</option>
                      <option value="from-red-500 to-pink-500">Red/Pink</option>
                      <option value="from-orange-500 to-yellow-500">Orange/Yellow</option>
                      <option value="from-purple-500 to-indigo-500">Purple/Indigo</option>
                      <option value="from-green-500 to-teal-500">Green/Teal</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link" className="text-slate-200">
                    Verification Link
                  </Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="https://example.com/verify/credential"
                    title="Enter a verification link (optional, must be a valid URL)"
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
                    {editingCertification ? "Update" : "Add"} Certification
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
              placeholder="Search certifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
              title="Search certifications by title, organization, or credential ID"
            />
          </div>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </motion.div>

        {/* Certifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCertifications.map((certification, index) => (
              <motion.div
                key={certification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-slate-100 text-lg">{certification.title}</CardTitle>
                        <CardDescription className="text-slate-400">{certification.organization}</CardDescription>
                      </div>
                      <div className={`text-3xl p-3 rounded-lg bg-gradient-to-br ${certification.color}`}>
                        {certification.badge}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-slate-300 text-sm">{certification.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {certification.issueDate}
                        </Badge>
                        {certification.credentialId && (
                          <Badge variant="secondary" className="text-xs">
                            ID: {certification.credentialId}
                          </Badge>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(certification)}
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(certification._id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {certification.link && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-indigo-400 hover:text-indigo-300 p-0 h-auto"
                          onClick={() => window.open(certification.link, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Verify Credential
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredCertifications.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="text-slate-400 text-lg">No certifications found</div>
            <p className="text-slate-500 mt-2">Try adjusting your search terms</p>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}