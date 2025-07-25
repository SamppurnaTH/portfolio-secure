"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  Star,
  FileUser,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdmin } from "./admin-provider"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Projects", href: "/admin/projects", icon: FolderOpen },
  { name: "Blogs", href: "/admin/blogs", icon: FileText },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Testimonials", href: "/admin/testimonials", icon: Star },
  { name: "Experience", href: "/admin/experience", icon: Briefcase },
  { name: "Certifications", href: "/admin/certifications", icon: BadgeCheck },
  { name: "Profile", href: "/admin/profile", icon: Settings },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAdmin()

  useEffect(() => {
    // This code runs only on the client side
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initial state for animation - only animate on mobile
  const initialX = isMobile ? -280 : 0

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800/80 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: initialX }}
        animate={{ x: isOpen || !isMobile ? 0 : initialX }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-cyan-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Admin Panel</h2>
                <p className="text-sm text-slate-400">Welcome, {user?.name || "Venu"}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href} legacyBehavior>
                  <a>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </motion.div>
                  </a>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-red-600/20"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}