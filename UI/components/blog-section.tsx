"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Define the Post interface matching your backend response
type Post = {
  _id: string
  title: string
  content: string // Added content as it's in backend response
  excerpt: string
  category: string
  tags: string[]
  image: string // Changed from 'featuredImage' to 'image' to match backend
  featured: boolean
  status: "draft" | "published"
  readTime: string
  slug: string
  createdAt: string // Changed from 'publishedAt' to 'createdAt' to match backend
  updatedAt: string // Added updatedAt
  views: number
  likes: number
  comments: number
}

const categories = ["All", "AI/ML", "Cybersecurity", "AI Security", "Tutorials"]

export default function BlogSection() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showAllPosts, setShowAllPosts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // Added error state

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // Get API base URL from env

  useEffect(() => {
    const fetchPosts = async () => {
      if (!API_BASE_URL) {
        setError("API base URL is not configured.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/posts`); // <--- FIXED: Using API_BASE_URL
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPosts(data.data);
        } else {
          setPosts([]);
          setError("No blog post data received or data format is incorrect.");
        }
      } catch (err: any) {
        setError(`Failed to load posts: ${err.message || 'Unknown error'}`);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [API_BASE_URL]); // Added API_BASE_URL to dependency array

  const filteredPosts = posts.filter((post) => {
    // If showAllPosts is false, only include featured posts.
    // Otherwise, include all posts that match the category.
    const isFeatured = showAllPosts ? true : post.featured; // Always true if showing all posts
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    
    return isFeatured && matchesCategory;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by most recent

  const handleReadMore = (slug: string) => {
    router.push(`/blog/${slug}`)
  }

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Latest Insights
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Sharing knowledge about AI/ML, Cybersecurity, and the future of technology
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category)
                // When selecting a category, default to showing only featured unless "All" is chosen or explicitly set to show all
                // For simplicity, let's reset setShowAllPosts based on category selection
                setShowAllPosts(category === "All" ? true : false) 
              }}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                  : "bg-slate-800/50 text-gray-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400">Loading articles...</div>
        ) : error ? ( // Display error message if there's an error
          <div className="text-center text-red-400">Error: {error}</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-gray-400">No articles found matching the current criteria.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card
                  className={`bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-500 overflow-hidden h-full ${
                    post.featured ? "ring-2 ring-purple-500/30" : ""
                  }`}
                >
                  {post.featured && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                        Featured
                      </span>
                    </div>
                  )}

                  <div className="relative overflow-hidden">
                    {/* Make the blog image clickable by wrapping it in a Link */}
                    <Link href={`/blog/${post.slug}`}>
                    <img
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                    />
                    </Link>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-sm rounded-full text-sm text-cyan-300 border border-cyan-400/30">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {/* Use post.createdAt as the date source from backend */}
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2 cursor-pointer">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-gray-400 mb-4 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 rounded text-xs text-purple-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all duration-300 group"
                      onClick={() => handleReadMore(post.slug)}
                    >
                      Read Full Article
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!showAllPosts && !loading && filteredPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
              onClick={() => setShowAllPosts(true)}
            >
              View All Articles
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
