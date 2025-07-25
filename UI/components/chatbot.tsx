"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Minimize2, Maximize2, Send, Loader2 } from "lucide-react" // Added Loader2 for loading indicator
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Message = {
  type: "user" | "bot"
  content: string
  timestamp: Date
}

// Initial greeting (can be fetched from backend on mount if preferred, but keeping static for simplicity)
const INITIAL_BOT_GREETING = "👋 Hey there! I'm **Killer**, Venu's AI Assistant. How can I help you today?";
const SECRET_MESSAGE = "🎉 You found the secret! Venu is passionate about creating secure AI solutions that make a real impact!";


export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: INITIAL_BOT_GREETING,
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false) // New loading state
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get API base URL from environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Auto-focus and scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
    scrollToBottom()
  }, [isOpen, isMinimized, messages, isLoading]) // Added isLoading to dependency array

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Easter egg activation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || typeof e.key === 'undefined') {
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        e.preventDefault()
        toggleChat()
      }

      if (!isOpen) {
        const sequence = ["v", "e", "n", "u"]
        const recentKeys = JSON.parse(localStorage.getItem("recentKeys") || "[]")

        recentKeys.push(e.key.toLowerCase())
        if (recentKeys.length > 4) recentKeys.shift()
        localStorage.setItem("recentKeys", JSON.stringify(recentKeys))

        if (JSON.stringify(recentKeys) === JSON.stringify(sequence)) {
          toggleChat()
          addBotMessage(SECRET_MESSAGE) // Using the client-side constant for secret
          localStorage.removeItem("recentKeys")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
    }
  }

  const addBotMessage = (content: string) => {
    setMessages(prev => [...prev, {
      type: "bot",
      content,
      timestamp: new Date()
    }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage = {
      type: "user" as const,
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input.trim() // Store current input before clearing
    setInput("")
    setIsLoading(true) // Set loading state

    if (!API_BASE_URL) {
      addBotMessage("Chatbot is not configured. Please check environment variables.");
      setIsLoading(false);
      return;
    }

    try {
      // Use API_BASE_URL for the fetch call to the backend
      const response = await fetch(`${API_BASE_URL}/api/chatbot`, { // <--- FIXED: Using API_BASE_URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response from chatbot.');
      }

      // Handle specific metadata from the backend
      if (data.metadata?.requiresClear) {
        setMessages([
          {
            type: "bot",
            content: INITIAL_BOT_GREETING, // Reset to initial greeting
            timestamp: new Date()
          }
        ]);
      } else {
        addBotMessage(data.message);

        if (data.metadata?.requiresAnimation === "matrix") {
          setTimeout(() => {
            const matrixChars = "01".split("")
            let matrixOutput = ""
            for (let i = 0; i < 50; i++) {
              matrixOutput += matrixChars[Math.floor(Math.random() * matrixChars.length)]
              if (i % 10 === 9) matrixOutput += "\n"
            }
            addBotMessage(matrixOutput)
          }, 1000)
        }
      }
    } catch (error) {
      addBotMessage("Oops! I'm having trouble connecting right now. Please try again later.");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{
              opacity: 1,
              scale: isMinimized ? 0.1 : 1,
              y: isMinimized ? 100 : 0,
              x: isMinimized ? 100 : 0
            }}
            exit={{ opacity: 0, scale: 0.8, y: 50, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed ${isMinimized ? "bottom-4 right-4 w-16 h-16 rounded-full" : "bottom-6 right-6 w-80 h-96 rounded-lg"} z-50`}
            style={{ originX: 1, originY: 1 }}
          >
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden h-full flex flex-col">
              {/* Header */}
              <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-cyan-400" />
                  {!isMinimized && <span className="text-sm text-gray-300">Killer (Venu's AI)</span>} {/* Updated name */}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    title={isMinimized ? "Maximize" : "Minimize"}
                    aria-label={isMinimized ? "Maximize Chat" : "Minimize Chat"}
                    className="p-1 hover:bg-slate-700 rounded transition-colors duration-200"
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Minimize2 className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={toggleChat}
                    title="Close Chat"
                    aria-label="Close Chat"
                    className="p-1 hover:bg-red-600 rounded transition-colors duration-200"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Chat Content */}
              {!isMinimized && (
                <>
                  <div className="flex-1 p-4 overflow-y-auto bg-slate-900/80 custom-scrollbar">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`mb-4 flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${message.type === "user"
                            ? "bg-cyan-600 text-white"
                            : "bg-slate-700 text-gray-300"}`}
                        >
                          <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                          <div className={`text-xs mt-1 ${message.type === "user" ? "text-cyan-200" : "text-gray-500"}`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="mb-4 flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-3 bg-slate-700 text-gray-300">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-slate-700 p-3 bg-slate-800">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-slate-700 border-slate-600 text-white"
                        placeholder={isLoading ? "Thinking..." : "Type a message..."} // Dynamic placeholder
                        autoComplete="off"
                        disabled={isLoading} // Disable input while loading
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700"
                        disabled={isLoading} // Disable button while loading
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                    <div className="text-xs text-gray-500 mt-2">
                      Try: "help", "projects", "enable-ai", "disable-ai" or type "venu" anywhere to activate!
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Toggle Button (only shown when chat is closed) */}
      {!isOpen && (
        <motion.button
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
          onClick={toggleChat}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          aria-label="Open Chatbot"
        >
          <MessageCircle className="h-8 w-8 text-white" />
        </motion.button>
      )}
    </>
  )
}
