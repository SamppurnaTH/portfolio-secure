"use client"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AdminContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  error: string | null
  checkAuth: () => Promise<void>
  clearError: () => void
  token: string | null
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const clearError = useCallback(() => setError(null), [])

  const storeToken = useCallback((newToken: string) => {
    // localStorage.setItem('token', newToken)
    setToken(newToken)
  }, [])

  const removeToken = useCallback(() => {
    // localStorage.removeItem('token')
    setToken(null)
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      clearError()
      // Removed or sanitized all console.log for production security
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          removeToken()
          throw new Error(errorData.message || "Session expired - please login again")
        }
        throw new Error(errorData.message || `Authentication failed (${response.status})`)
      }
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
      } else {
        setUser(null)
        removeToken()
      }
    } catch (err) {
      setUser(null)
      removeToken()
      if (!pathname.startsWith("/admin/login")) {
        setError(err instanceof Error ? err.message : "Authentication failed")
      }
    } finally {
      setIsLoading(false)
    }
  }, [pathname, clearError, removeToken])

  useEffect(() => {
    // Remove localStorage token logic
    // const storedToken = localStorage.getItem('token')
    // if (storedToken) { ... }
    // Instead, always check auth on mount if not on login page
    if (!pathname.startsWith("/admin/login")) {
      checkAuth()
    } else {
      setIsLoading(false)
    }
  }, [pathname, checkAuth])

  useEffect(() => {
    if (isLoading) return

    const isLoginPage = pathname === "/admin/login"
    const isAdminRoute = pathname.startsWith("/admin")

    if (user && isLoginPage) {
      router.push("/admin")
    } else if (!user && isAdminRoute && !isLoginPage) {
      router.push("/admin/login")
    }
  }, [user, pathname, isLoading, router])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      clearError()

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Login failed (${response.status})`)
      }

      const data = await response.json()
      if (!data.user) {
        throw new Error("Invalid login response")
      }
      setUser(data.user)
      // Do not store token in localStorage
      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      // Attempt logout API call only if we have a token
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setUser(null)
      setToken(null)
      router.push("/admin/login")
      setIsLoading(false)
    }
  }

  const value = {
    user,
    login,
    logout,
    isLoading,
    error,
    checkAuth,
    clearError,
    token
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}