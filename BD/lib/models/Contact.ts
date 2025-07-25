import type { ObjectId } from "mongodb"

export interface Contact {
  _id?: ObjectId
  name: string
  email: string
  message: string
  projectType: "freelance" | "fulltime" | "contract" | "other" | "student"
  budget?: string
  company?: string
  status: "new" | "read" | "replied" | "archived"
  reply?: {
    message: string
    sentAt: Date
    admin: string
  }
  createdAt: Date
  ipAddress?: string
  userAgent?: string
}

export interface ContactInput {
  name: string
  email: string
  message: string
  projectType: "freelance" | "fulltime" | "contract" | "other" | "student"
  budget?: string
  company?: string
}
