import type { ObjectId } from "mongodb"

export interface Experience {
  _id?: ObjectId
  company: string
  position: string            
  startDate: string            
  endDate: string              
  location: string
  description: string
  technologies: string[]
  logo?: string                
  createdAt: Date
  updatedAt: Date
}

export interface ExperienceInput {
  company: string
  position: string             
  startDate: string          
  endDate: string              
  location: string
  description: string
  technologies: string[]
  logo?: string                
}
