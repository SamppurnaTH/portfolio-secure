"use client"

import { useEffect, useState } from "react" // useState and useEffect are kept in case they are used elsewhere in a more complex setup, but 'particles' related use is removed.
import { motion } from "framer-motion"
import { Heart, Code, Coffee } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  // Removed all state and effects related to particles.
  // const [particles, setParticles] = useState<
  //   { left: number; top: number; duration: number; x: number; y: number }[]
  // >([])

  // useEffect(() => {
  //   const generateParticles = Array.from({ length: 10 }, () => ({
  //     left: Math.random() * 100,
  //     top: Math.random() * 100,
  //     x: Math.random() * 50,
  //     y: Math.random() * 50,
  //     duration: Math.random() * 15 + 10,
  //   }))
  //   setParticles(generateParticles)
  // }, [])

  return (
    <footer className="py-12 border-t border-slate-800 relative">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Venu Thota
            </h3>
            <p className="text-gray-400 leading-relaxed">
              ML Engineer & Cyber Security Enthusiast crafting secure, intelligent, and scalable digital solutions.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["About", "Experience", "Projects", "Certifications", "Contact"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Tech Focus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold text-white mb-4">Specializations</h4>
            <ul className="space-y-2">
              {["AI/ML Development", "Cyber Security", "Full Stack Development", "Cloud Solutions"].map((spec) => (
                <li key={spec} className="text-gray-400">
                  {spec}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-slate-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <span>© {currentYear} Venu Thota. Made with</span>
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <span>and</span>
              <Code className="h-4 w-4 text-cyan-400" />
              <span>and lots of</span>
              <Coffee className="h-4 w-4 text-yellow-600" />
            </div>

            <div className="text-gray-400 text-sm">
              Crafted with precision, powered by passion, and inspired by possibilities.
            </div>
          </div>
        </motion.div>
      </div>

      {/* Removed: Animated Background Elements */}
      {/* The following div and its content were removed:
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
            animate={{
              x: [0, particle.x],
              y: [0, particle.y],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>
      */}
    </footer>
  )
}