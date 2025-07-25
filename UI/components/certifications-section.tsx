"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Calendar, ExternalLink } from "lucide-react"

// Updated Type: Keep it as is, we'll map incoming data to this structure
type Certification = {
  _id: string
  title: string
  issuer: string // Standardized to 'issuer'
  date: string    // Standardized to 'date'
  description: string
  badge: string
  color: string // e.g., "from-blue-500 to-cyan-500"
  credentialId: string
  link: string
}

export default function CertificationsSection() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // State for API errors

  // Get API base URL from environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchCertifications = async () => {
      if (!API_BASE_URL) {
        console.error("NEXT_PUBLIC_API_URL is not defined.");
        setError("API base URL is not configured. Please check your .env.local file.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/certifications`);
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        
        // Check if data.success and data.data is an array
        if (data.success && Array.isArray(data.data)) {
          // Map backend response to match the Certification type consistently
          const processedCertifications = data.data.map((item: any) => ({
            _id: item._id,
            title: item.title,
            issuer: item.issuer || item.organization || 'N/A', // Use issuer, fallback to organization
            date: item.date || item.issueDate || 'N/A',       // Use date, fallback to issueDate
            description: item.description,
            badge: item.badge,
            color: item.color,
            credentialId: item.credentialId,
            link: item.link,
          }));
          setCertifications(processedCertifications);
        } else {
          console.warn("API response was successful but 'data' array was not found or was not an array:", data);
          setCertifications([]); // Set to empty array if data format is unexpected
          setError("No certification data received or data format is incorrect.");
        }
      } catch (err: any) {
        console.error("Error fetching certifications:", err);
        setError(`Failed to load certifications: ${err.message || 'Unknown error'}`);
        setCertifications([]); // Clear certifications on error
      } finally {
        setLoading(false);
      }
    }

    fetchCertifications();
  }, [API_BASE_URL]); // Dependency array includes API_BASE_URL

  const handleVerifyClick = (link: string) => {
    if (link) { // Ensure link exists before opening
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      console.warn("No verification link available for this certification.");
      // Optionally provide user feedback like a toast notification
    }
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
            Certifications
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional certifications validating my expertise in various technologies
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400">Loading certifications...</div>
        ) : error ? ( // Display error message if there's an error
          <div className="text-center text-red-400">Error: {error}</div>
        ) : certifications.length === 0 ? (
          <div className="text-center text-gray-400">No certifications found.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-300 h-full relative overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cert.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                  ></div>

                  <CardContent className="p-6 relative z-10">
                    {/* Badge */}
                    <div className="text-center mb-4">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${cert.color} mb-3 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <span className="text-2xl">{cert.badge}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">
                        {cert.title}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-cyan-400 mb-3">
                        <Award className="h-4 w-4" />
                        <span className="font-medium text-sm">{cert.issuer}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{cert.date}</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        {cert.description}
                      </p>
                      <div className="text-xs text-gray-500 mb-4">
                        ID: {cert.credentialId}
                      </div>

                      {/* Verify Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleVerifyClick(cert.link)}
                        // Disable button if link is empty or 'N/A'
                        disabled={!cert.link || cert.link === 'N/A'}
                        className={`w-full py-2 px-4 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2
                          ${cert.link && cert.link !== 'N/A' ? 'hover:from-cyan-600 hover:to-purple-600' : 'opacity-50 cursor-not-allowed'}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Verify
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}