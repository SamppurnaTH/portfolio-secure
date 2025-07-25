"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Shield, Code, Zap } from "lucide-react"

const skills = [
  { name: "AI/ML Development", level: 90, icon: Brain, color: "from-purple-500 to-pink-500" },
  { name: "Cyber Security", level: 85, icon: Shield, color: "from-red-500 to-orange-500" },
  { name: "Full Stack Development", level: 88, icon: Code, color: "from-blue-500 to-cyan-500" },
  { name: "Prompt Engineering", level: 92, icon: Zap, color: "from-green-500 to-emerald-500" },
]

export default function AboutSection() {
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
            About Me
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A passionate Computer Science student specializing in AI/ML and Cyber Security. I bridge the gap between
            cutting-edge technology and practical security solutions.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Description */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-300">
              <CardContent className="p-8">
                <blockquote className="text-2xl font-light text-gray-300 mb-6 italic">
                  "Driven by curiosity. Powered by code. Focused on impact."
                </blockquote>
                <p className="text-gray-400 leading-relaxed mb-6">
                  With a strong foundation in both artificial intelligence and cybersecurity, I create solutions that
                  are not only intelligent but also secure and scalable. My experience spans from developing machine
                  learning models to implementing robust security protocols.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Python", "React", "TensorFlow", "Azure", "Node.js", "Cyber Security"].map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-full text-sm text-cyan-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side - Skills */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="flex items-center mb-3">
                  <skill.icon className="h-6 w-6 text-cyan-400 mr-3" />
                  <span className="text-lg font-medium text-gray-200">{skill.name}</span>
                  <span className="ml-auto text-cyan-400 font-bold">{skill.level}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    transition={{ duration: 1.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className={`h-full bg-gradient-to-r ${skill.color} rounded-full relative`}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
