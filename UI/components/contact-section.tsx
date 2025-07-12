"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Github,
  Linkedin,
  Code,
  Trophy,
  Loader2,
} from "lucide-react"
import { toast } from "sonner" 

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "venuthota721@gmail.com",
    href: "mailto:venuthota721@gmail.com",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 95055 11839",
    href: "tel:+919505511839",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: MapPin,
    label: "Location (Home)", // Updated label to include "Home"
    value: "3-83, Seeram Bavi, Chandrasekharapuram, Andhra Pradesh 523112", // Updated address
    href: "https://www.google.com/maps?q=15.180328218159113,79.27945088844828", // Updated coordinates
    color: "from-purple-500 to-pink-500",
  },
]

const socialLinks = [
  {
    icon: Github,
    label: "GitHub",
    href: "https://github.com/venuthota",
    color: "hover:text-gray-300",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://linkedin.com/in/thotavenkatavenu",
    color: "hover:text-blue-400",
  },
  {
    icon: Code,
    label: "LeetCode",
    href: "https://leetcode.com/u/THOTAVENU/", 
    color: "hover:text-yellow-400",
  },
  {
    icon: Trophy,
    label: "HackerRank",
    href: "https://www.hackerrank.com/profile/21KN1A42I0",
    color: "hover:text-green-400",
  },
]


export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get API base URL from environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!API_BASE_URL) {
      toast.error("Contact form not configured. Please check environment variables.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use API_BASE_URL for the fetch call to the backend
      const res = await fetch(`${API_BASE_URL}/api/contact`, { // <--- FIXED: Using API_BASE_URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        // If response is not OK, assume it's an error response from backend
        // data?.error for generic error, data?.issues for Zod validation errors
        throw new Error(data?.error || data?.message || data?.issues?.[0]?.message || "Failed to send message.")
      }

      toast.success(data.message || "Message sent successfully!")
      // Clear the form on successful submission
      setFormData({ name: "", email: "", subject: "", message: "" })
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-20 relative" id="contact">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Ready to collaborate on your next project? Let's create something amazing together!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Contact Info + Socials */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h3 className="text-2xl font-bold text-white mb-4">Let's Connect</h3>
            <p className="text-gray-400 mb-6">
              I'm always excited to discuss new opportunities, innovative projects, or just chat about AI/ML and Cyber Security.
            </p>

            {contactInfo.map((info, i) => (
              <motion.a
                key={i}
                href={info.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${info.color} group-hover:scale-110 transition`}>
                        <info.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{info.label}</p>
                        <p className="text-white font-medium group-hover:text-cyan-400">{info.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.a>
            ))}

            {/* Social Links */}
            <div className="pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">Follow Me</h4>
              <div className="flex gap-4">
                {socialLinks.map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-full bg-slate-800/50 border border-slate-700 hover:border-cyan-400 ${social.color}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-400/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      name="name"
                      placeholder="Name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                      className="bg-slate-700/50 border-slate-600 focus:border-cyan-400 text-white"
                    />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                      className="bg-slate-700/50 border-slate-600 focus:border-cyan-400 text-white"
                    />
                  </div>
                  <Input
                    name="subject"
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className="bg-slate-700/50 border-slate-600 focus:border-cyan-400 text-white"
                  />
                  <Textarea
                    name="message"
                    placeholder="Message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    disabled={isSubmitting}
                    required
                    className="bg-slate-700/50 border-slate-600 focus:border-cyan-400 text-white resize-none"
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-3 rounded-lg transition hover:scale-105 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
