"use client"

import { motion } from "framer-motion"
import HeroSection from "@/components/hero-section"
import ProfileSection from "@/components/profile-section"
import AboutSection from "@/components/about-section"
import ExperienceSection from "@/components/experience-section"
import ProjectsSection from "@/components/projects-section"
import CertificationsSection from "@/components/certifications-section"
import TechStackSection from "@/components/tech-stack-section"
import ContactSection from "@/components/contact-section"
import Footer from "@/components/footer"
import ParticleBackground from "@/components/particle-background"
import BlogSection from "@/components/blog-section"
import TestimonialsSection from "@/components/testimonials-section"
import ChatBot from "@/components/chatbot"

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-x-hidden">
      <ParticleBackground />

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Main Content Sections */}
        <HeroSection />
        <ProfileSection />

        <section id="about" className="scroll-mt-24 pt-24">
          <AboutSection />
        </section>

        <section id="experience" className="scroll-mt-24 pt-24">
          <ExperienceSection />
        </section>

        <section id="projects" className="scroll-mt-24 pt-24">
          <ProjectsSection />
        </section>

        <section id="certifications" className="scroll-mt-24 pt-24">
          <CertificationsSection />
        </section>

        <section id="techstack" className="scroll-mt-24 pt-24">
          <TechStackSection />
        </section>

        <section id="blog" className="scroll-mt-24 pt-24">
          <BlogSection />
        </section>

        <section id="testimonials" className="scroll-mt-24 pt-24">
          <TestimonialsSection />
        </section>

        <section id="contact" className="scroll-mt-24 pt-24">
          <ContactSection />
        </section>

        <Footer />

        {/* ✅ ChatBot fixed to bottom-right corner */}
        <div className="fixed bottom-6 right-6 z-[999]">
          <ChatBot />
        </div>
      </motion.div>
    </div>
  )
}
