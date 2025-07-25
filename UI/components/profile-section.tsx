"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import {
  User,
  MapPin,
  Calendar,
  GraduationCap,
  Award, // Used for Certifications
  Code,
  Brain, // Keeping Brain icon for general profile card animation
  Shield, // Keeping Shield icon for general profile card animation
  Star,
  Mail,
  Phone,
  Trophy, // Used for Achievements tab icon
  Target,
  Zap,
  Heart,
} from "lucide-react"
import { useState, useEffect, ForwardRefExoticComponent, RefAttributes } from "react"
import { useInView } from "react-intersection-observer"
import { LucideProps } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Define the shape of an achievement object
interface Achievement {
  title: string;
  type: string;
  year: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
}

const useCounter = (target: number, duration: number = 2000) => {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true })

  useEffect(() => {
    if (!inView) return

    let start = 0
    const increment = target / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.ceil(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [inView, target, duration])

  return { count, ref }
}

const calculateExperience = () => {
  const startYear = 2025 // Assuming professional experience started in 2025
  const currentYear = new Date().getFullYear()
  // Ensure non-negative experience
  return currentYear - startYear > 0 ? currentYear - startYear : 0
}

const personalInfo = {
  name: "Venu Thota",
  title: "ML Engineer & Cyber Security Enthusiast",
  location: "C.S.Puram, India",
  education: "Computer Science Student",
  email: "venuthota721@example.com",
  phone: "+91 9505511839",
  bio: "Passionate about creating secure, intelligent solutions that make a real-world impact. I bridge the gap between cutting-edge AI/ML technologies and robust cybersecurity practices.",
  interests: ["Machine Learning", "Cybersecurity", "Cloud Computing", "Open Source"],
  languages: ["English", "Telugu"],
  availability: "Open to opportunities",
}

export default function ProfileSection() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isHovered, setIsHovered] = useState(false) // This state is not directly used in the provided snippet beyond onHoverStart/End

  const [projectsCount, setProjectsCount] = useState(0)
  const [certificationsCount, setCertificationsCount] = useState(0)
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    if (!API_BASE) {
      // Removed all console.error for production security
      return;
    }
    const fetchCounts = async () => {
      try {
        const [projectsRes, certsRes] = await Promise.all([
          fetch(`${API_BASE}/api/projects`),
          fetch(`${API_BASE}/api/certifications`),
          // Removed fetch for 'experience' as achievements will only be based on certifications
        ])

        const [projectsData, certsData] = await Promise.all([
          projectsRes.ok ? projectsRes.json() : Promise.resolve([]),
          certsRes.ok ? certsRes.json() : Promise.resolve({ data: [] }),
        ])

        // Set projects count (handling potential data structures)
        setProjectsCount(projectsData?.length || projectsData?.data?.length || 0)
        // Set certifications count
        setCertificationsCount(certsData?.success ? certsData.data.length : 0)

        const certs = certsData?.data || []

        // Filter and map only valid certifications for achievements
        const filteredCertifications: Achievement[] = certs
          .filter((item: any) => item.title || item.name) // Only include items with a title or name
          .map((item: any) => ({
            title: item.title || item.name, // Use existing title or name, no "Untitled" fallback
            type: "Certification", // Explicitly set type
            year: item.year || new Date().getFullYear().toString(), // Fallback to current year if no year provided
            icon: Award, // Always use Award icon for certifications
          }))
        setAchievements(filteredCertifications)
      } catch (err) {
        // Removed all console.error for production security
      }
    }

    fetchCounts()
  }, []) // Empty dependency array means this runs once on mount

  const profileStats = [
    { label: "Projects Completed", value: projectsCount, icon: Code, color: "from-blue-500 to-cyan-500" },
    { label: "Certifications", value: certificationsCount, icon: Award, color: "from-purple-500 to-pink-500" },
    { label: "Years Experience", value: calculateExperience(), icon: Calendar, color: "from-green-500 to-emerald-500" },
    { label: "Technologies", value: 20, icon: Zap, color: "from-yellow-500 to-orange-500" },
  ]

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Developer Profile
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Get to know the person behind the code</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-1 flex flex-col"
          >
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-500 overflow-hidden relative group flex-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-cyan-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:via-cyan-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>

              <CardContent className="p-8 relative z-10 flex flex-col h-full">
                {/* Profile Image */}
                <motion.div
                  className="relative mb-6 flex-1 flex flex-col justify-center"
                  onHoverStart={() => setIsHovered(true)}
                  onHoverEnd={() => setIsHovered(false)}
                >
                  <div className="w-48 h-48 mx-auto relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 p-1"
                    >
                      <div className="w-full h-full rounded-full bg-slate-800"></div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="absolute inset-2 rounded-full overflow-hidden shadow-lg"
                    >
                      <img
                        src="/Avatar.png"
                        alt="Profile Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </motion.div>

                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-slate-800 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                    className="absolute top-4 right-12 text-cyan-400"
                  >
                    <Brain className="h-8 w-8" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                    className="absolute bottom-4 left-12 text-purple-400"
                  >
                    <Shield className="h-8 w-8" />
                  </motion.div>
                </motion.div>

                {/* Basic Info */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{personalInfo.name}</h3>
                  <p className="text-cyan-400 font-medium mb-3">{personalInfo.title}</p>

                  <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{personalInfo.location}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                    <GraduationCap className="h-4 w-4" />
                    <span>{personalInfo.education}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-300 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    {personalInfo.availability}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profileStats.map((stat, index) => {
                const { count, ref } = useCounter(stat.value, 2000)
                
                return (
                  <motion.div
                    key={index}
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-300 text-center p-4">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} mb-3 mx-auto`}
                      >
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {count}
                        {(stat.label === "Projects Completed" || stat.label === "Technologies") && "+"}
                      </div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Tabbed Content */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-300">
              <CardContent className="p-6">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 bg-slate-700/50 p-1 rounded-lg">
                  {[
                    { id: "overview", label: "Overview", icon: User },
                    { id: "achievements", label: "Achievements", icon: Trophy },
                    { id: "interests", label: "Interests", icon: Heart },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all duration-300 ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">About Me</h4>
                        <p className="text-gray-300 leading-relaxed">{personalInfo.bio}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-cyan-400 mb-3">Contact Information</h5>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Mail className="h-4 w-4 text-cyan-400" />
                              <span className="text-sm">{personalInfo.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Phone className="h-4 w-4 text-cyan-400" />
                              <span className="text-sm">{personalInfo.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-cyan-400 mb-3">Languages</h5>
                          <div className="flex flex-wrap gap-2">
                            {personalInfo.languages.map((lang) => (
                              <span
                                key={lang}
                                className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 rounded-full text-sm text-purple-300"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "achievements" && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Certifications & Achievements</h4>
                      {achievements.length > 0 ? (
                        achievements.map((achievement, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:border-cyan-400/50 transition-all duration-300"
                          >
                            <div className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600">
                              {/* Render the icon dynamically based on achievement.icon */}
                              {achievement.icon && <achievement.icon className="h-5 w-5 text-white" />}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-white">{achievement.title}</h5>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>{achievement.type}</span>
                                <span>•</span>
                                <span>{achievement.year}</span>
                              </div>
                            </div>
                            <Star className="h-5 w-5 text-yellow-400" />
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4">No certifications to display yet.</p>
                      )}
                    </div>
                  )}

                  {activeTab === "interests" && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Areas of Interest</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {personalInfo.interests.map((interest, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                              className="p-4 bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-lg border border-slate-600 hover:border-cyan-400/50 transition-all duration-300 text-center"
                            >
                              <div className="text-2xl mb-2">
                                {index === 0 && "🧠"}
                                {index === 1 && "🛡️"}
                                {index === 2 && "☁️"}
                                {index === 3 && "💻"}
                              </div>
                              <span className="text-white font-medium">{interest}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-cyan-400 mb-3">Current Focus</h5>
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-400/30 rounded-lg">
                          <Target className="h-6 w-6 text-cyan-400" />
                          <span className="text-gray-300">Building secure AI/ML solutions for real-world impact</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}