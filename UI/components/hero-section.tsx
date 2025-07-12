"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Download, Mail, Github, Linkedin, Code, Database, Shield, Brain, Loader2, X, Send } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { z } from "zod"

// Define types
interface AnimatedParticle {
  id: number;
  left: string;
  top: string;
  x: number[];
  y: number[];
  opacity: number[];
  duration: number;
}

interface TechIcon {
  icon: any;
  name: string;
  color: string;
}

interface SocialLink {
  icon: any;
  href: string;
  label: string;
}

// Zod schema for frontend form validation
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  message: z.string().min(10, "Message must be at least 10 characters.").max(500, "Message must be at most 500 characters."),
  projectType: z.enum(["freelance", "fulltime", "contract", "other", "student"]),
  budget: z.string().optional(),
  company: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const techIcons: TechIcon[] = [
  { icon: Code, name: "React", color: "text-blue-400" },
  { icon: Brain, name: "Python", color: "text-yellow-400" },
  { icon: Database, name: "Node.js", color: "text-green-400" },
  { icon: Shield, name: "Azure", color: "text-cyan-400" },
]

const roles = ["AI&ML Engineer", "Cyber Security Enthusiast", "Full Stack Developer"]

const socialLinks: SocialLink[] = [
  { icon: Github, href: "https://github.com/SamppurnaTH", label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/thotavenkatavenu", label: "LinkedIn" },
]

export default function HeroSection() {
  const [currentRole, setCurrentRole] = useState(0)
  const [animatedParticles, setAnimatedParticles] = useState<AnimatedParticle[]>([])
  const [isHoveringProfile, setIsHoveringProfile] = useState(false)
  const [resumeState, setResumeState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [hireMeState, setHireMeState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [showContactModal, setShowContactModal] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
    projectType: 'freelance',
    budget: '50000-250000',
    company: ''
  })

  // Define API_BASE for consistent use
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Effect for cycling roles
  useEffect(() => {
    if (!API_BASE) {
      console.error("API base URL is not configured.");
      return;
    }
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [API_BASE])

  // Effect for generating animated background particles
  useEffect(() => {
    if (!API_BASE) {
      console.error("API base URL is not configured.");
      return;
    }
    const generatedParticles: AnimatedParticle[] = [...Array(10)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      x: [0, Math.random() * 50 - 25, 0],
      y: [0, Math.random() * 50 - 25, 0],
      opacity: [0.2, 0.6, 0.2],
      duration: Math.random() * 15 + 10,
    }))
    setAnimatedParticles(generatedParticles)
  }, [API_BASE])

  const handleHireMeClick = () => {
    setShowContactModal(true)
    setShowContactForm(false)
    setHireMeState('idle')
    setFormErrors({})
    setFormData({
      name: '',
      email: '',
      message: '',
      projectType: 'freelance',
      budget: '50000-250000',
      company: ''
    })
  }

  const handleQuickEmail = () => {
    const subject = "Opportunity for Collaboration"
    const body = `Hello Venu,\n\nI saw your portfolio and would like to discuss a potential collaboration.\n\nBest regards,\n[Your Name]`
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@example.com'}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
    setShowContactModal(false)
  }

  const handleShowContactForm = () => {
    setShowContactForm(true)
  }

  const handleDownloadResume = async () => {
    setResumeState('loading')
    const fileName = `Venu_Thota_Resume_${new Date().toISOString().slice(0, 10)}.pdf`
    
    try {
      const apiResponse = await fetch(`${API_BASE}/api/resume`)
      
      if (apiResponse.ok) {
        const blob = await apiResponse.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = apiResponse.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        setResumeState('idle')
        return
      }

      console.log('API resume download failed or not found, attempting local fallback...')
      const localPath = '/uploads/VENU_THOTA.pdf'
      const link = document.createElement('a')
      link.href = localPath
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setResumeState('idle')
      
    } catch (error) {
      console.error('Resume download error:', error)
      setResumeState('error')
      setTimeout(() => setResumeState('idle'), 3000)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHireMeState('loading')
    setFormErrors({})

    try {
      const parsedData = contactFormSchema.parse(formData)

      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setHireMeState('success')
        setTimeout(() => {
          setShowContactModal(false)
          setShowContactForm(false)
        }, 2000)
        setFormData({
          name: '',
          email: '',
          message: '',
          projectType: 'freelance',
          budget: '50000-250000',
          company: ''
        })
      } else {
        setHireMeState('error')
        if (result.issues) {
          const errors: Record<string, string> = {}
          result.issues.forEach((issue: { field: string; message: string }) => {
            errors[issue.field] = issue.message
          })
          setFormErrors(errors)
        } else if (result.error) {
          setFormErrors({ general: result.error })
        } else if (result.message) {
          setFormErrors({ general: result.message })
        }
        console.error('Form submission error:', result.error || result.message || 'Unknown server error')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message
        })
        setFormErrors(errors)
      } else {
        setFormErrors({ general: 'An unexpected error occurred. Please try again.' })
      }
      setHireMeState('error')
      console.error('Client-side form submission error:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Logo at top left */}
      <div className="absolute top-6 left-6 z-20 w-16 h-16">
        <Image
          src="/logo.png"
          alt="Logo"
          width={64}
          height={64}
          className="object-contain"
        />
      </div>
      
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-sm" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {animatedParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: particle.opacity,
            }}
            transition={{
              duration: particle.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{
              left: particle.left,
              top: particle.top,
            }}
          />
        ))}
      </div>
      
      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 relative"
            >
              <button
                onClick={() => {
                  setShowContactModal(false)
                  setShowContactForm(false)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                aria-label="Close contact modal"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Let's Work Together
              </h2>

              {showContactForm ? (
                <>
                  {hireMeState === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-500/20 border border-green-400/30 text-green-300 p-3 rounded-lg mb-4 text-center"
                    >
                      ✅ Message sent successfully! I'll get back to you soon.
                    </motion.div>
                  )}
                  {hireMeState === 'error' && formErrors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/20 border border-red-400/30 text-red-300 p-3 rounded-lg mb-4 text-center"
                    >
                      {formErrors.general}
                    </motion.div>
                  )}

                  <form onSubmit={handleFormSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="Your Name"
                        />
                        {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="Email Address"
                        />
                        {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                      </div>
                      <div>
                        <label htmlFor="projectType" className="block text-sm font-medium text-gray-300 mb-1">
                          I am a/an...
                        </label>
                        <select
                          id="projectType"
                          name="projectType"
                          value={formData.projectType}
                          onChange={handleInputChange}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        >
                          <option value="freelance">Individual/Company Representative (Freelance Project)</option>
                          <option value="fulltime">Individual/Company Representative (Full-time Position)</option>
                          <option value="contract">Individual/Company Representative (Contract Work)</option>
                          <option value="student">Student</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
                          Company / Organization (Optional)
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="Company / Organization (Optional)"
                        />
                      </div>
                      <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-1">
                          Budget Range (INR)
                        </label>
                        <select
                          id="budget"
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        >
                          <option value="25000-50000">₹25,000 - ₹50,000</option>
                          <option value="50000-250000">₹50,000 - ₹2,50,000</option>
                          <option value="250000+">₹2,50,000+</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={4}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="Message"
                        />
                        {formErrors.message && <p className="text-red-400 text-xs mt-1">{formErrors.message}</p>}
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 w-full sm:w-auto"
                        disabled={hireMeState === 'loading'}
                      >
                        {hireMeState === 'loading' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          'Send Message'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 px-6 py-3 rounded-lg transition-all duration-300 w-full sm:w-auto"
                        onClick={() => {
                          setShowContactForm(false)
                        }}
                      >
                        Back to Options
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
                      onClick={handleShowContactForm}
                    >
                      <Mail className="mr-2 h-5 w-5" />
                      Send Message (Fill Form)
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900"
                      onClick={handleQuickEmail}
                    >
                      <Send className="mr-2 h-5 w-5" />
                      Quick Email Instead
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Content */}
        <div className="text-center lg:text-left max-w-2xl">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Hi, I'm Venu Thota
            </h1>
            <div className="text-2xl md:text-3xl text-gray-300 mb-6 h-16">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentRole}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block"
                >
                  {roles[currentRole]}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="text-xl text-gray-400 leading-relaxed">
              Crafting secure, intelligent, and scalable digital solutions through the power of AI/ML and Cyber Security
            </p>
          </motion.div>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
          >
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg hover:shadow-cyan-500/25"
                onClick={handleHireMeClick}
              >
                <Mail className="mr-2 h-5 w-5" />
                Hire Me
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant={resumeState === 'error' ? 'destructive' : 'outline'}
                size="lg"
                className={`border-2 ${resumeState === 'error' ? 'border-red-400' : 'border-cyan-400'} ${resumeState === 'error' ? 'text-red-400' : 'text-cyan-400'} hover:bg-cyan-400 hover:text-slate-900 px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-[1.03]`}
                onClick={handleDownloadResume}
                disabled={resumeState === 'loading'}
              >
                {resumeState === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparing...
                  </>
                ) : resumeState === 'error' ? (
                  'Failed! Retry?'
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download Resume
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Tech Icons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center lg:justify-start gap-8 mb-8"
          >
            {techIcons.map((tech) => (
              <motion.div 
                key={tech.name} 
                whileHover={{ scale: 1.2, y: -5 }} 
                className="group relative"
              >
                <tech.icon 
                  className={`h-8 w-8 ${tech.color} transition-all duration-300`} 
                  aria-hidden="true"
                />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  {tech.name}
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex justify-center lg:justify-start gap-6"
          >
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="p-3 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-cyan-400 transition-all duration-300"
                aria-label={`Visit my ${social.label}`}
              >
                <social.icon className="h-6 w-6 text-gray-400 hover:text-cyan-400 transition-colors duration-300" />
              </motion.a>
            ))}
          </motion.div>
        </div>
        
        {/* Right Profile Section */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative hidden lg:block"
        >
          <div className="relative w-80 h-80 xl:w-96 xl:h-96">
            {/* Glowing highlight effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: isHoveringProfile ? 1 : 0,
                scale: isHoveringProfile ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 via-purple-400/20 to-pink-400/20 blur-xl"
            />
            
            {/* Floating profile image with subtle animation */}
            <motion.div
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0"
              onHoverStart={() => setIsHoveringProfile(true)}
              onHoverEnd={() => setIsHoveringProfile(false)}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/hero.jpg"
                  alt="Venu Thota"
                  fill
                  className={`object-cover rounded-full border-4 ${isHoveringProfile ? 'border-cyan-400/50 shadow-2xl shadow-cyan-400/40' : 'border-cyan-400/30 shadow-2xl shadow-cyan-400/20'} transition-all duration-300`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </div>
            </motion.div>
          </div>
          
          {/* Animated text that appears on hover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isHoveringProfile ? 1 : 0,
              y: isHoveringProfile ? 0 : 20
            }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-8 left-0 right-0 text-center text-cyan-400 text-lg font-medium"
          >
            That's me!
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-cyan-400 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 4, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-cyan-400 rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  )
}