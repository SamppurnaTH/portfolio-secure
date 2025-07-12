// components/context/ApiConfigContext.tsx
"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

const ApiConfigContext = createContext<{
  baseUrl: string
  setBaseUrl: (url: string) => void
}>({
  baseUrl: "",
  setBaseUrl: () => {},
})

export const ApiConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [baseUrl, setBaseUrl] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("apiBaseUrl")
    if (stored) setBaseUrl(stored)
  }, [])

  const handleSetUrl = (url: string) => {
    localStorage.setItem("apiBaseUrl", url)
    setBaseUrl(url)
  }

  return (
    <ApiConfigContext.Provider value={{ baseUrl, setBaseUrl: handleSetUrl }}>
      {children}
    </ApiConfigContext.Provider>
  )
}

export const useApiConfig = () => useContext(ApiConfigContext)
