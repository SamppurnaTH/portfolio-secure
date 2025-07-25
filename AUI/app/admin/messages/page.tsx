"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Mail, MailOpen, Archive, Reply, Trash2, Globe, Smartphone, Copy, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Message {
  _id: string
  name: string
  email: string
  subject: string
  message: string
  status: "new" | "replied" | "archived"
  createdAt: string
  ipAddress?: string
  userAgent?: string
  priority?: "low" | "medium" | "high"
  reply?: {
    message: string;
    sentAt: string;
    admin: string;
  };
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isGeneratingReplyDraft, setIsGeneratingReplyDraft] = useState(false)
  const { toast } = useToast()

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE) {
    throw new Error('API base URL is not configured.');
  }

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/contact`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setMessages(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      setMessages([])
      toast({
        title: "Failed to load messages",
        description: error instanceof Error ? error.message : "There was an error fetching the data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [API_BASE, toast])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = 
      message.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = activeTab === "all" || message.status === activeTab
    return matchesSearch && matchesTab
  })

  const handleStatusChange = async (messageId: string, newStatus: Message["status"]) => {
    if (!newStatus) {
      toast({
        title: "Status is required",
        description: "Please provide a valid status.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/contact/${messageId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, status: newStatus } : msg
      ))
      
      toast({
        title: `Message marked as ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating message status:", error)
      toast({
        title: "Failed to update message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return
    }

    try {
      setDeletingId(messageId)
      const response = await fetch(`${API_BASE}/api/contact/${messageId}`, {
        method: "DELETE",
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setMessages(messages.filter(msg => msg._id !== messageId))
      setSelectedMessages(selectedMessages.filter(id => id !== messageId))
      toast({ title: "Message deleted successfully" })
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Failed to delete message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) {
      toast({ title: "No messages selected", variant: "destructive" })
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedMessages.length} messages?`)) {
      return
    }

    try {
      setBulkDeleting(true)
      const response = await fetch(`${API_BASE}/api/contact/bulk`, {
        method: "POST",
        credentials: 'include',
        body: JSON.stringify({ 
          ids: selectedMessages,
          action: "delete"
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json();
      setMessages(messages.filter(msg => !selectedMessages.includes(msg._id)))
      setSelectedMessages([])
      toast({ title: `${result.affectedCount || selectedMessages.length} messages deleted` })
    } catch (error) {
      console.error("Error performing bulk delete:", error)
      toast({
        title: "Failed to delete messages",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleBulkStatusChange = async (newStatus: "replied" | "archived") => {
    if (selectedMessages.length === 0) {
      toast({ title: "No messages selected", variant: "destructive" })
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/contact/bulk`, {
        method: "POST",
        credentials: 'include',
        body: JSON.stringify({ 
          ids: selectedMessages,
          action: "update",
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json();
      setMessages(messages.map(msg => 
        selectedMessages.includes(msg._id) ? { ...msg, status: newStatus } : msg
      ))
      setSelectedMessages([])
      toast({ 
        title: `${result.affectedCount || selectedMessages.length} messages ${newStatus === "archived" ? "archived" : "marked as replied"}` 
      })
    } catch (error) {
      console.error("Error performing bulk action:", error)
      toast({
        title: "Failed to update messages",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev =>
      prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedMessages(
      selectedMessages.length === filteredMessages.length && filteredMessages.length > 0
        ? []
        : filteredMessages.map(msg => msg._id)
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "bg-red-600"
      case "medium": return "bg-yellow-600"
      case "low": return "bg-green-600"
      default: return "bg-slate-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new": return <Mail className="w-4 h-4" />
      case "replied": return <MailOpen className="w-4 h-4" />
      case "archived": return <Archive className="w-4 h-4" />
      default: return <Mail className="w-4 h-4" />
    }
  }

  const handleReplyInit = async (message: Message) => {
    setReplyingTo(message);
    setReplyContent("Generating AI draft...");
    setIsGeneratingReplyDraft(true);

    try {
      const response = await fetch(`${API_BASE}/api/contact/generate-ai-reply/${message._id}`, {
        method: "GET",
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setReplyContent(result.generatedReply || "Could not generate an AI reply. Please type manually.");

      toast({
        title: "AI Reply Draft Generated",
        description: "Review and modify the draft before sending.",
      });
    } catch (error) {
      console.error("Error generating AI reply draft:", error);
      setReplyContent(`Dear ${message.name},\n\nThank you for your message about "${message.subject}".\n\n[Your response here]\n\nBest regards,\n[Your Name]`);
      toast({
        title: "Failed to Generate AI Draft",
        description: error instanceof Error ? error.message : "Using default template instead.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReplyDraft(false);
    }
  };

  const handleSendReply = () => {
    if (!replyingTo || !replyContent.trim()) {
      toast({
        title: "Reply cannot be empty",
        variant: "destructive"
      });
      return;
    }

    // Create mailto link with pre-filled content
    const subject = `Re: ${replyingTo.subject}`;
    const body = encodeURIComponent(replyContent);
    const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(replyingTo.email)}&su=${encodeURIComponent(subject)}&body=${body}`;

    // Open Gmail in a new tab
    window.open(mailtoLink, '_blank');

    // Update local state to mark as replied
    setMessages(messages.map(msg => 
      msg._id === replyingTo._id ? { 
        ...msg, 
        status: "replied", 
        reply: { 
          message: replyContent, 
          sentAt: new Date().toISOString(), 
          admin: "You" 
        } 
      } : msg
    ));

    toast({
      title: "Ready to send reply",
      description: "Gmail has been opened with your reply draft.",
    });

    setReplyingTo(null);
    setReplyContent("");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(replyContent);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste it into your email client.",
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header and search section remains the same */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Messages</h1>
            <p className="text-slate-400">Manage contact form submissions</p>
          </div>

          {selectedMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2"
            >
              <span className="text-sm text-slate-400">{selectedMessages.length} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange("replied")}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Reply className="w-4 h-4 mr-1" />
                Mark Replied
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange("archived")}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Archive className="w-4 h-4 mr-1" />
                Archive
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDelete}
                className="border-red-600 text-red-400 hover:bg-red-600/20"
                disabled={bulkDeleting}
              >
                {bulkDeleting ? (
                  <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-red-400 rounded-full" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
          />
        </motion.div>

        {/* Messages list section remains the same */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800">
              <TabsTrigger value="all" className="data-[state=active]:bg-indigo-600">
                All ({messages.length})
              </TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-indigo-600">
                New ({messages.filter(m => m.status === "new").length})
              </TabsTrigger>
              <TabsTrigger value="replied" className="data-[state=active]:bg-indigo-600">
                Replied ({messages.filter(m => m.status === "replied").length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="data-[state=active]:bg-indigo-600">
                Archived ({messages.filter(m => m.status === "archived").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredMessages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2 mb-4 p-3 bg-slate-800/50 rounded-lg"
                >
                  <Checkbox
                    checked={selectedMessages.length === filteredMessages.length && filteredMessages.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-slate-300">
                    Select all {filteredMessages.length} messages
                  </span>
                </motion.div>
              )}

              <div className="space-y-4">
                <AnimatePresence>
                  {filteredMessages.map((message, index) => (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                    >
                      <Card
                        className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 ${
                          selectedMessages.includes(message._id) ? "ring-2 ring-indigo-500" : ""
                        }`}
                      >
                        <CardHeader>
                          <div className="flex items-start space-x-4">
                            <Checkbox
                              checked={selectedMessages.includes(message._id)}
                              onCheckedChange={() => toggleMessageSelection(message._id)}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <CardTitle className="text-slate-100 text-lg">{message.name}</CardTitle>
                                  {message.priority && (
                                    <Badge className={`${getPriorityColor(message.priority)} text-white text-xs`}>
                                      {message.priority}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                                    {getStatusIcon(message.status)}
                                    <span className="ml-1 capitalize">{message.status}</span>
                                  </Badge>
                                </div>
                                <span className="text-sm text-slate-400">{formatDate(message.createdAt)}</span>
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-slate-400 mb-3">
                                <span>{message.email}</span>
                                {message.ipAddress && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      <Globe className="w-3 h-3 mr-1" />
                                      {message.ipAddress}
                                    </span>
                                  </>
                                )}
                                {message.userAgent && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      {message.userAgent.includes("iPhone") || message.userAgent.includes("Android") ? (
                                        <Smartphone className="w-3 h-3 mr-1" />
                                      ) : (
                                        <Globe className="w-3 h-3 mr-1" />
                                      )}
                                      {message.userAgent.includes("iPhone") || message.userAgent.includes("Android") ? "Mobile" : "Desktop"}
                                    </span>
                                  </>
                                )}
                              </div>

                              <CardDescription className="text-slate-300 font-medium mb-2">
                                {message.subject}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <p className="text-slate-400 mb-4 line-clamp-3">{message.message}</p>

                          {message.reply && (
                            <div className="mt-4 p-3 bg-slate-700/50 rounded-md border border-slate-600">
                                <h5 className="text-sm font-medium text-slate-300 mb-1">Your Reply:</h5>
                                <p className="text-slate-400 text-sm italic line-clamp-3">{message.reply.message}</p>
                                <p className="text-xs text-slate-500 mt-1">Sent by {message.reply.admin} on {formatDate(message.reply.sentAt)}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex space-x-2">
                              {message.status === "new" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReplyInit(message)}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    <Reply className="w-4 h-4 mr-1" />
                                    Reply
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(message._id, "replied")}
                                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                  >
                                    <MailOpen className="w-4 h-4 mr-1" />
                                    Mark Replied
                                  </Button>
                                </>
                              )}

                              {message.status !== "archived" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(message._id, "archived")}
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                >
                                  <Archive className="w-4 h-4 mr-1" />
                                  Archive
                                </Button>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/20"
                              onClick={() => handleDeleteMessage(message._id)}
                              disabled={deletingId === message._id}
                            >
                              {deletingId === message._id ? (
                                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-red-400 rounded-full" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredMessages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <div className="text-slate-400 text-lg">No messages found</div>
                  <p className="text-slate-500 mt-2">
                    {activeTab === "all" ? "No messages yet" : `No ${activeTab} messages`}
                  </p>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Reply Dialog - Updated for Gmail integration */}
      <Dialog open={!!replyingTo} onOpenChange={(open) => !open && setReplyingTo(null)}>
        <DialogContent className="sm:max-w-2xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Reply to {replyingTo?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Email will be sent to: {replyingTo?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-1">Original Message</h4>
              <div className="p-3 bg-slate-700/50 rounded-md text-slate-300 text-sm">
                <p className="font-medium">{replyingTo?.subject}</p>
                <p className="mt-1">{replyingTo?.message}</p>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="reply-content" className="text-sm font-medium text-slate-300">
                  Your Response
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="text-slate-400 hover:text-slate-300"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[200px] bg-slate-800 border-slate-700 text-slate-100"
                placeholder="Generate an AI draft or type your reply here..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyingTo(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={isGeneratingReplyDraft || !replyContent.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isGeneratingReplyDraft ? (
                <>
                  <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2" />
                  Generating Draft...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Open in Gmail
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}