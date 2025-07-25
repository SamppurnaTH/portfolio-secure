import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ApiConfigProvider } from "@/components/context/ApiConfigContext"
import { AdminProvider } from "@/components/admin/admin-provider"
import AdminShell from "@/components/admin/admin-shell"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Admin Dashboard | Venu Thota",
  description: "Admin panel for managing portfolio data such as projects, blogs, testimonials, and more.",
  generator: "Next.js App Router, Tailwind CSS, MongoDB, ShadCN UI",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <ApiConfigProvider>
        <AdminProvider>
          <AdminShell>{children}</AdminShell>
        </AdminProvider>
      </ApiConfigProvider>
    </div>
  )
}