"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { FolderOpen, FileText, MessageSquare, Eye, AlertCircle, File, Upload, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdmin } from "@/components/admin/admin-provider"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Progress } from "@/components/ui/progress"
// The Input component was imported but not used, keeping it for consistency if needed later.
// import { Input } from "@/components/ui/input" 

// --- New/Updated Interfaces for Live Data ---
interface Project {
  _id: string;
  views?: number; // Make this mandatory if you guarantee it from backend
  createdAt: string; // Make this mandatory for monthly stats
  // Add other project properties as they come from your backend
}

interface BlogPost {
  _id: string;
  views?: number; // Make this mandatory if you guarantee it from backend
  createdAt: string; // Make this mandatory for monthly stats
  // Add other blog post properties as they come from your backend
}

interface ContactMessage {
  _id: string;
  // Add other message properties if needed
}

interface MonthlyStat {
  name: string
  projects: number
  blogs: number
}

// Updated DashboardData to reflect that project/post views are used
interface DashboardData {
  totalProjects: number
  blogPosts: number
  messages: number
  totalViews: number // This will now truly be the sum of actual views
  monthlyStats: MonthlyStat[]
  resumeUrl: string | null
}

interface ResumeUploadState {
  file: File | null
  isUploading: boolean
  progress: number
  error: string | null
  success: string | null
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAdmin()
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProjects: 0,
    blogPosts: 0,
    messages: 0,
    totalViews: 0,
    monthlyStats: [],
    resumeUrl: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumeState, setResumeState] = useState<ResumeUploadState>({
    file: null,
    isUploading: false,
    progress: 0,
    error: null,
    success: null
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE) {
    throw new Error('API base URL is not configured.');
  }
  const API_URL = `${API_BASE}/api/dashboard`
  const RESUME_URL = `${API_BASE}/api/resume`

  // --- Helper to calculate total views (TRULY LIVE) ---
  // This now strictly sums the 'views' property from your fetched projects and posts.
  // No more hardcoded additions.
  const calculateTotalViews = (projects: Project[], posts: BlogPost[]): number => {
    const projectsViews = projects?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
    const postsViews = posts?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
    return projectsViews + postsViews;
  }

  // --- Helper to generate monthly stats based on actual creation dates (TRULY LIVE) ---
  const generateMonthlyStats = (projects: Project[], posts: BlogPost[]): MonthlyStat[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear(); // Focus on the current year's data

    // Initialize stats for each month
    const statsMap = new Map<string, { projects: number; blogs: number }>();
    months.forEach(month => statsMap.set(month, { projects: 0, blogs: 0 }));

    // Populate projects data
    projects?.forEach(p => {
      try {
        const date = new Date(p.createdAt);
        if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) { // Validate date and filter by current year
          const monthName = months[date.getMonth()];
          const currentStats = statsMap.get(monthName)!;
          currentStats.projects++;
          statsMap.set(monthName, currentStats);
        }
      } catch (e) {
        console.warn(`Invalid createdAt date for project: ${p._id}`, p.createdAt);
      }
    });

    // Populate blogs data
    posts?.forEach(b => {
      try {
        const date = new Date(b.createdAt);
        if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) { // Validate date and filter by current year
          const monthName = months[date.getMonth()];
          const currentStats = statsMap.get(monthName)!;
          currentStats.blogs++;
          statsMap.set(monthName, currentStats);
        }
      } catch (e) {
        console.warn(`Invalid createdAt date for blog post: ${b._id}`, b.createdAt);
      }
    });

    return Array.from(statsMap.entries()).map(([name, values]) => ({
      name,
      projects: values.projects,
      blogs: values.blogs
    }));
  }

  useEffect(() => {
    console.log('[Dashboard] authLoading:', authLoading, 'user:', user)
    
    if (authLoading) {
      console.log('⏳ Auth still loading, skipping fetch')
      return
    }
    if (!user) {
      setError("Not authenticated. Please login again.")
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const { signal } = controller
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        // No token check, rely on cookie
        const res = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          signal,
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          if (res.status === 401) {
            throw new Error("Session expired. Please login again.")
          }
          throw new Error(errorData.message || `Failed to fetch dashboard data (${res.status})`)
        }
        const apiRes = await res.json();
        const { projects = [], posts = [], contact = [] } = apiRes.data || {};
        setDashboardData({
          totalProjects: projects.length,
          blogPosts: posts.length,
          messages: contact.length,
          totalViews: calculateTotalViews(projects, posts),
          monthlyStats: generateMonthlyStats(projects, posts),
          resumeUrl: null // update if backend provides
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
    return () => controller.abort()
  }, [authLoading, user, API_URL])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      // Validate file type (PDF only)
      if (file.type !== "application/pdf") {
        setResumeState(prev => ({
          ...prev,
          error: "Only PDF files are allowed",
          success: null
        }))
        return
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setResumeState(prev => ({
          ...prev,
          error: "File size must be less than 5MB",
          success: null
        }))
        return
      }
      setResumeState(prev => ({
        ...prev,
        file,
        error: null,
        success: null
      }))
    }
  }

  const uploadResume = async () => {
    if (!resumeState.file) return

    if (!user) {
      setResumeState(prev => ({
        ...prev,
        error: "Authentication required. Please login again.",
        success: null
      }))
      return
    }

    const formData = new FormData()
    formData.append("resume", resumeState.file)

    try {
      setResumeState(prev => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
        success: null
      }))

      const xhr = new XMLHttpRequest()
      xhr.open("POST", RESUME_URL, true)
      xhr.withCredentials = true; // Enable cookie-based auth

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setResumeState(prev => ({
            ...prev,
            progress
          }))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            // SAFELY CHECK FOR 'response.data.url'
            if (response && response.data && response.data.url) {
              setDashboardData(prev => ({
                ...prev,
                resumeUrl: response.data.url
              }))
              setResumeState(prev => ({
                ...prev,
                isUploading: false,
                success: "Resume uploaded successfully!",
                file: null,
                progress: 0
              }))
            } else {
              // Handle cases where the backend response is successful but doesn't have the expected URL
              setResumeState(prev => ({
                ...prev,
                isUploading: false,
                error: "Upload succeeded, but could not retrieve resume URL from response. Please check server response format.",
                success: null
              }));
            }
          } catch (parseError) {
            // Handle JSON parsing errors or unexpected response formats
            console.error("Error parsing resume upload response:", parseError);
            setResumeState(prev => ({
              ...prev,
              isUploading: false,
              error: "An error occurred processing the server response.",
              success: null
            }));
          }
        } else {
          // This block handles non-2xx HTTP status codes
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            setResumeState(prev => ({
              ...prev,
              isUploading: false,
              error: errorResponse.message || `Upload failed with status ${xhr.status}`,
              success: null
            }));
          } catch (parseError) {
            // Fallback for non-JSON error responses
            setResumeState(prev => ({
              ...prev,
              isUploading: false,
              error: `Upload failed with status ${xhr.status}. Non-JSON response received.`,
              success: null
            }));
          }
        }
      }

      xhr.onerror = () => {
        setResumeState(prev => ({
          ...prev,
          isUploading: false,
          error: "Network error during upload. Could not reach the server.",
          success: null
        }));
      }

      xhr.send(formData)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResumeState(prev => ({
          ...prev,
          isUploading: false,
          error: err.message,
          success: null
        }))
      }
    }
  }

  const stats = [
    {
      title: "Total Projects",
      value: dashboardData.totalProjects,
      icon: FolderOpen,
      color: "text-indigo-400",
      bgColor: "bg-indigo-600/20"
    },
    {
      title: "Blog Posts",
      value: dashboardData.blogPosts,
      icon: FileText,
      color: "text-cyan-400",
      bgColor: "bg-cyan-600/20"
    },
    {
      title: "Messages",
      value: dashboardData.messages,
      icon: MessageSquare,
      color: "text-green-400",
      bgColor: "bg-green-600/20"
    },
    {
      title: "Total Views",
      value: dashboardData.totalViews,
      icon: Eye,
      color: "text-purple-400",
      bgColor: "bg-purple-600/20"
    }
  ]

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Checking authentication...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                Hi {user?.name || "Admin"} 👋
              </h1>
              <p className="text-slate-400">Here's your portfolio overview</p>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading dashboard</p>
              <p className="text-sm">{error}</p>
              <div className="mt-2 text-xs space-y-1">
                <p>• Backend server must run at: {API_BASE}</p>
                <p>• Token must be stored in localStorage</p>
              </div>
              <button onClick={() => location.reload()} className="mt-2 text-sm bg-red-800/50 hover:bg-red-800/70 px-3 py-1 rounded">
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                          <p className="text-2xl font-bold text-slate-100 mt-1">{typeof stat.value === "number" ? stat.value.toLocaleString() : ""}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-2">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">Monthly Overview</CardTitle>
                    <CardDescription className="text-slate-400">Projects and blogs over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboardData.monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} />
                        <Bar dataKey="projects" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="blogs" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <Card className="bg-slate-800/50 border-slate-700 h-full">
                  <CardHeader>
                    <CardTitle className="text-slate-100">Resume Management</CardTitle>
                    <CardDescription className="text-slate-400">Upload your latest resume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.resumeUrl && (
                        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center">
                            <File className="w-5 h-5 text-slate-300 mr-2" />
                            <span className="text-slate-200 text-sm truncate">
                              {dashboardData.resumeUrl.split('/').pop()}
                            </span>
                          </div>
                          <a 
                            href={dashboardData.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                          >
                            View
                          </a>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="resume-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-slate-600 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-3 text-slate-400" />
                              <p className="mb-2 text-sm text-slate-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-slate-500">PDF only (max. 5MB)</p>
                            </div>
                            <input
                              id="resume-upload"
                              type="file"
                              className="hidden"
                              accept=".pdf,application/pdf"
                              onChange={handleFileChange}
                              disabled={resumeState.isUploading}
                            />
                          </label>
                        </div>

                        {resumeState.file && (
                          <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <File className="w-4 h-4 text-slate-300 mr-2" />
                                <span className="text-slate-200 text-sm truncate">
                                  {resumeState.file.name}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {(resumeState.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <Button
                              onClick={uploadResume}
                              disabled={resumeState.isUploading}
                              className="w-full"
                              variant="default"
                            >
                              {resumeState.isUploading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Resume
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {resumeState.isUploading && (
                          <Progress value={resumeState.progress} className="h-2" />
                        )}

                        {(resumeState.error || resumeState.success) && (
                          <div className={`p-3 rounded-lg flex items-start ${resumeState.error ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'}`}>
                            {resumeState.error ? (
                              <XCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-red-400" />
                            ) : (
                              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-green-400" />
                            )}
                            <div>
                              <p className={`text-sm ${resumeState.error ? 'text-red-200' : 'text-green-200'}`}>
                                {resumeState.error || resumeState.success}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}