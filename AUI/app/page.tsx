"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function AdminHomePage() {
  const router = useRouter()

  const handleLogin = () => {
    router.push("/admin/login")
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="text-center space-y-6 max-w-md w-full"
      >
        <h1 className="text-4xl font-bold">Welcome, Admin</h1>
        <p className="text-slate-300">Access the portal to manage your content and settings.</p>

        <Button
          onClick={handleLogin}
          className="text-lg px-6 py-3 w-full max-w-xs"
          size="lg"
        >
          Admin Login
        </Button>
      </motion.div>
    </main>
  )
}
