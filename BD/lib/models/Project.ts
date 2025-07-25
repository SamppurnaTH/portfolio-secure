// B:\Portfolio\BD\lib\models\Project.ts

import type { ObjectId } from "mongodb"

export interface Project {
  _id?: ObjectId
  title: string
  slug: string
  description: string
  excerpt: string
  technologies: string[]
  category: string
  image: string
  githubUrl?: string
  liveUrl?: string
  tags: string[]
  featured: boolean
  status: "draft" | "published"
  createdAt: Date // <-- ALREADY HERE! Important for monthly stats
  updatedAt: Date
  views: number // <-- ALREADY HERE! Important for live views
  likes: number
}

export interface ProjectInput {
  title: string
  description: string
  excerpt: string
  technologies: string[]
  category: string
  image: string
  githubUrl?: string
  liveUrl?: string
  tags: string[]
  featured?: boolean
  status?: "draft" | "published"
}