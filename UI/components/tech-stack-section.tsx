"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Code, Shield, Cloud, Database, Wrench } from "lucide-react"
import { useEffect, useState } from "react" // Import useEffect and useState

// Define a type for the particle data
interface Particle {
  id: number;
  left: string;
  top: string;
  x: number[];
  y: number[];
  rotate: number[];
  opacity: number[];
  duration: number;
  icon: string;
}

const techCategories = [
  {
    title: "AI/ML",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
    technologies: ["Python", "TensorFlow", "Scikit-learn", "NLTK", "Pandas", "NumPy"],
  },
  {
    title: "Web Development",
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    technologies: ["React", "Next.js", "Node.js", "HTML/CSS", "JavaScript", "TypeScript"],
  },
  {
    title: "Cyber Security",
    icon: Shield,
    color: "from-red-500 to-orange-500",
    technologies: ["Nmap", "Burp Suite", "OWASP ZAP", "Wireshark", "Metasploit", "Kali Linux"],
  },
  {
    title: "Cloud & DevOps",
    icon: Cloud,
    color: "from-green-500 to-emerald-500",
    technologies: ["Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Terraform"],
  },
  {
    title: "Databases",
    icon: Database,
    color: "from-yellow-500 to-orange-500",
    technologies: ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "Supabase"],
  },
  {
    title: "Tools & Others",
    icon: Wrench,
    color: "from-indigo-500 to-purple-500",
    technologies: ["Git", "VS Code", "Jupyter", "Postman", "Linux", "Figma"],
  },
]

const floatingIcons = ["⚡", "🚀", "💻", "🔧", "⚙️", "🛡️", "🧠", "☁️"];

export default function TechStackSection() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // This code runs only on the client after the component mounts
    const generatedParticles: Particle[] = [...Array(15)].map((_, i) => ({
      id: i, // Unique key
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      x: [0, Math.random() * 100 - 50],
      y: [0, Math.random() * 100 - 50],
      rotate: [0, 360],
      opacity: [0.1, 0.3, 0.1],
      duration: Math.random() * 20 + 10,
      icon: floatingIcons[Math.floor(Math.random() * floatingIcons.length)],
    }));
    setParticles(generatedParticles);
  }, []); // Empty dependency array means this runs once on mount

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
            Tech Stack
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Technologies and tools I use to bring ideas to life</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {techCategories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-cyan-400/50 transition-all duration-300 h-full relative overflow-hidden">
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                ></div>

                <CardContent className="p-6 relative z-10">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-r ${category.color} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
                      {category.title}
                    </h3>
                  </div>

                  {/* Technologies Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {category.technologies.map((tech, techIndex) => (
                      <motion.div
                        key={tech}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 + techIndex * 0.05 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05 }}
                        className="group/tech"
                      >
                        <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-cyan-400/50 transition-all duration-300 text-center group-hover/tech:bg-slate-600/50">
                          <span className="text-sm text-gray-300 group-hover/tech:text-cyan-300 transition-colors duration-300 font-medium">
                            {tech}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Floating Tech Icons Animation - Modified for Hydration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((particle) => ( // Use the state-managed particles
            <motion.div
              key={particle.id} // Use the unique ID from the particle object
              className="absolute text-cyan-400/10 text-2xl"
              animate={{
                x: particle.x,
                y: particle.y,
                rotate: particle.rotate,
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
            >
              {particle.icon}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}