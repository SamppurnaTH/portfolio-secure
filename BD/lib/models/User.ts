import type { ObjectId } from "mongodb"

// Reusable user role type (easy to extend later)
export type UserRole = "admin" | "user" // | "moderator" | "editor"

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  photo?: string          // ✅ For profile/avatar support
  isActive?: boolean      // ✅ For soft delete / status toggle
}

export interface UserInput {
  email: string
  password: string
  name: string
  role?: UserRole         // ✅ Uses shared type
  photo?: string          // ✅ Optional profile image
  isActive?: boolean      // ✅ Optional for account status control
}
