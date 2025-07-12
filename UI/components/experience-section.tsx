"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Building, Calendar, MapPin } from "lucide-react"

// Updated Experience interface to match backend response
interface Experience {
  _id: string;
  company: string;
  position: string; // Changed from 'role' to 'position'
  startDate: string; // Added startDate
  endDate: string;   // Added endDate
  location: string;
  description: string;
  technologies: string[];
  logo: string;
}

export default function ExperienceSection() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Added error state

  // Get API base URL from environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchExperiences = async () => {
      if (!API_BASE_URL) {
        setError("API base URL is not configured.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/experience`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        // Ensure data.data exists and is an array
        if (data.success && Array.isArray(data.data)) {
          setExperiences(data.data);
        } else {
          setExperiences([]); // Set to empty array if no data or not successful
        }
      } catch (error: any) {
        console.error("Failed to fetch experiences:", error);
        setError(`Failed to load experiences: ${error.message}`);
        setExperiences([]); // Clear experiences on error
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [API_BASE_URL]); // Dependency array includes API_BASE_URL

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
            Experience
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            My journey through various roles in AI/ML and Cyber Security
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-400">Loading experiences...</div>
        ) : error ? ( // Display error message if there's an error
          <div className="text-center text-red-400">Error: {error}</div>
        ) : experiences.length === 0 ? (
          <div className="text-center text-gray-400">No experiences found.</div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500 rounded-full hidden md:block"></div>

            <div className="space-y-12">
              {experiences.map((exp, index) => {
                // Format duration from startDate and endDate
                const durationFormatted = `${exp.startDate.substring(0, 7)} - ${exp.endDate.substring(0, 7)}`;

                return (
                  <motion.div
                    key={exp._id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className={`flex items-center ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-col`}
                  >
                    {/* Timeline Dot */}
                    <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full border-4 border-slate-900 z-10"></div>

                    {/* Content Card */}
                    <div className={`w-full md:w-5/12 ${index % 2 === 0 ? "md:pr-8" : "md:pl-8"}`}>
                      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/10">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Render emoji logo directly if it's an emoji string */}
                            {exp.logo && (
                              <div className="text-4xl">
                                {exp.logo.length < 5 ? exp.logo : <Building className="h-10 w-10 text-cyan-400" />}
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors duration-300">
                                {exp.position} {/* Changed from exp.role to exp.position */}
                              </h3>
                              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                <Building className="h-4 w-4" />
                                <span className="font-medium">{exp.company}</span>
                              </div>
                              <div className="flex items-center gap-4 text-gray-400 text-sm mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{durationFormatted}</span> {/* Using formatted duration */}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{exp.location}</span>
                                </div>
                              </div>
                              <p className="text-gray-300 mb-4 leading-relaxed">{exp.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {exp.technologies.map((tech) => (
                                  <span
                                    key={tech}
                                    className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 rounded text-xs text-purple-300"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}