"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Filter, Edit, Trash2, Eye, Calendar, Clock, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import ImageUploader from '@/components/custom/image-uploader'

// --- UPDATED INTERFACES TO ALIGN WITH BACKEND ---
// This interface now closely matches your backend's Post interface,
// but with `_id` as string (from ObjectId) and `publishedAt` derived from `createdAt`.
interface BlogPostDisplay {
  _id: string; // Maps directly from backend's _id
  title: string;
  slug: string; // Added from backend Post model
  content: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  category: string;
  status: "published" | "draft";
  featured: boolean;
  views: number;
  createdAt: string; // Raw date string from backend, will be formatted for display
  updatedAt: string; // Raw date string from backend
  image?: string;
  // Removed metaTitle, metaDescription, ogImage as they are not in your backend Post model
}

// This interface reflects what the API POST/PUT endpoints expect (PostInput from backend)
interface BlogPostPayload {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[]; // This expects an array of strings
  image: string; // Keep as required, as per backend PostInput
  featured?: boolean;
  status?: "draft" | "published";
  readTime: string;
}

// Interface for the form data, where 'tags' is a string
interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  tags: string; // This expects a comma-separated string for the input field
  category: string;
  status: "published" | "draft";
  featured: boolean;
  image: string; // Will be required on the input field now
}


interface ApiResponse {
  success: boolean;
  // Data type for fetching multiple posts
  data: BlogPostDisplay[];
}

interface SinglePostApiResponse {
  success: boolean;
  // Data type for creating/updating a single post
  data: BlogPostDisplay;
}

const categories = ["Tutorial", "Guide", "News", "Opinion", "Case Study", "AI/ML"]

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogPostDisplay[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all"); // New state for status filter
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<BlogPostDisplay | null>(null)
  // Removed activeTab state as we are no longer using tabs for the form
  const { toast } = useToast()

  // Use the new BlogFormData interface for the state
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    excerpt: "",
    content: "",
    readTime: "5 min read",
    tags: "", // Comma-separated string for form input
    category: "",
    status: "draft",
    featured: false,
    image: "",
  })

  // Helper to format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      console.error("Invalid date string:", dateString);
      return "N/A";
    }
  };


  const fetchBlogPosts = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== "all") {
        queryParams.append("category", selectedCategory);
      }
      if (selectedStatus !== "all") {
        queryParams.append("status", selectedStatus);
      }
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const url = `/api/posts?${queryParams.toString()}`;
      console.log("Fetching from:", url); // Debugging: See the URL being hit

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Map backend _id to frontend id, and format createdAt for display
        const transformedBlogs: BlogPostDisplay[] = result.data.map(blog => ({
          ...blog,
          _id: blog._id.toString(), // Ensure _id is a string
          createdAt: blog.createdAt, // Keep as string or Date based on actual API response type. If Date object, it needs formatting here.
          updatedAt: blog.updatedAt, // Keep as string or Date
        }));
        setBlogs(transformedBlogs);
      } else {
        throw new Error("Invalid data format received from API");
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      setBlogs([]);
      toast({
        title: "Failed to load blog posts",
        description: error instanceof Error ? error.message : "There was an error fetching data",
        variant: "destructive",
      });
    }
  }, [selectedCategory, selectedStatus, searchTerm, toast]); // Dependencies for useCallback

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  // Frontend filtering is now removed as the backend will handle it
  // The 'filteredBlogs' state will directly be `blogs` from the API response
  const displayedBlogs = blogs;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = formData.tags.split(",").map((tag) => tag.trim()).filter(tag => tag !== "");

    // Payload aligns with BlogPostPayload (backend PostInput)
    const payload: BlogPostPayload = {
      title: formData.title,
      excerpt: formData.excerpt,
      content: formData.content,
      readTime: formData.readTime,
      tags: tagsArray, // This is correctly typed as string[] now
      category: formData.category,
      status: formData.status,
      featured: formData.featured,
      image: formData.image, // Ensure this is always provided and valid as per backend
    };

    try {
      let response: Response;
      if (editingBlog) {
        response = await fetch(`/api/posts/${editingBlog._id}`, { // Use _id for the URL
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        }
        toast({ title: "Blog post updated successfully" });
      } else {
        response = await fetch(`/api/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        }
        toast({ title: "Blog post created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBlogPosts(); // Re-fetch all posts to update the list
    } catch (error: any) {
      console.error("Error submitting blog post:", error);
      toast({
        title: `Failed to ${editingBlog ? "update" : "create"} blog post`,
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      readTime: "5 min read",
      tags: "", // Reset as string
      category: "",
      status: "draft",
      featured: false,
      image: "",
    });
    setEditingBlog(null);
    // Removed setActiveTab as we are not using tabs
  };

  const handleEdit = (blog: BlogPostDisplay) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      readTime: blog.readTime,
      tags: blog.tags.join(", "), // Convert string[] to string for the form input
      category: blog.category,
      status: blog.status,
      featured: blog.featured,
      image: blog.image || "", // Ensure image is populated or empty string if null/undefined
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (_id: string) => { // Use _id directly
    if (!window.confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`/api/posts/${_id}`, { // Use _id for the URL
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      toast({ title: "Blog post deleted successfully" });
      fetchBlogPosts(); // Re-fetch posts after deletion
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Failed to delete blog post",
        description: error instanceof Error ? error.message : "There was an error deleting the post.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Blog Posts</h1>
            <p className="text-slate-400">Manage your blog content</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-100">
                  {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                </DialogTitle>
                <DialogDescription className="text-slate-400">Write and publish your blog content</DialogDescription>
              </DialogHeader>

              {/* Removed Tabs component and its children */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                    <Label htmlFor="category" className="text-slate-200">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-slate-100">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-slate-200">
                    Excerpt
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-slate-200">
                    Content (Markdown)
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-slate-100 font-mono"
                    rows={12}
                    placeholder="# Your blog post title&#10;&#10;Write your content in markdown..."
                    required
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
                      placeholder="React, Next.js, TypeScript"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="readTime" className="text-slate-200">
                      Read Time (e.g., "5 min read")
                    </Label>
                    <Input
                      id="readTime"
                      type="text"
                      value={formData.readTime}
                      onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                      placeholder="e.g., 5 min read"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-slate-200">
                    Main Image
                  </Label>
                  <ImageUploader
                    initialImage={formData.image}
                    onUpload={async (file) => {
                      const formDataObj = new FormData();
                      formDataObj.append('file', file);
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
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

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <Label htmlFor="featured" className="text-slate-200">
                      Featured Post
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="status"
                      checked={formData.status === "published"}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, status: checked ? "published" : "draft" })
                      }
                    />
                    <Label htmlFor="status" className="text-slate-200">
                      {formData.status === "published" ? "Published" : "Draft"}
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    {editingBlog ? "Update" : "Create"} Post
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
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-100">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-slate-100">
                All Categories
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-slate-100">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-slate-100">
              <Tag className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-slate-100">All Statuses</SelectItem>
              <SelectItem value="published" className="text-slate-100">Published</SelectItem>
              <SelectItem value="draft" className="text-slate-100">Draft</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {displayedBlogs.map((blog, index) => (
              <motion.div
                key={blog._id} // Use _id as key
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-slate-100 text-lg line-clamp-2">{blog.title}</CardTitle>
                        <CardDescription className="text-slate-400 mt-2 line-clamp-2">{blog.excerpt}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {blog.featured && <Badge className="bg-indigo-600 text-white">Featured</Badge>}
                        <Badge variant={blog.status === "published" ? "default" : "secondary"}>{blog.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {blog.image && (
                      <div className="mb-4">
                        <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover rounded-md" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {blog.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-slate-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {blog.views}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {blog.readTime}
                        </span>
                        <span className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          {blog.category}
                        </span>
                      </div>
                      {blog.createdAt && (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(blog.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(blog)}
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(blog._id)}
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

        {displayedBlogs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="text-slate-400 text-lg">No blog posts found</div>
            <p className="text-slate-500 mt-2">Try adjusting your search terms or filters, or create a new post</p>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}