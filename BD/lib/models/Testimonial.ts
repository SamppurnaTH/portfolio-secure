import type { ObjectId } from "mongodb";

export type RelationshipType =
  | "supervisor"
  | "mentor"
  | "colleague"
  | "client"
  | "manager"
  | "teamLead"
  | "stakeholder"
  | "partner";

// MongoDB document shape
export interface Testimonial {
  _id?: ObjectId;
  name: string;
  role: string;
  company: string;
  image: string;
  content: string;
  rating: number; // Between 1 and 5
  relationship: RelationshipType; // ✅ Professional
  project?: string; // <--- MADE OPTIONAL TO MATCH ZOD SCHEMA AND FRONTEND BEHAVIOR
  featured?: boolean; // <--- MADE OPTIONAL FOR CONSISTENCY WITH BACKEND LOGIC
  status?: "draft" | "published"; // <--- MADE OPTIONAL FOR CONSISTENCY WITH BACKEND LOGIC
  createdAt: Date;
  updatedAt: Date;
}

// Form input shape from frontend (already looks good, 'project' already optional implicitly due to its usage with optional types)
export interface TestimonialInput {
  name: string;
  role: string;
  company: string;
  image: string;
  content: string;
  rating: number;
  relationship: RelationshipType;
  project?: string; // This can remain as is, or explicitly match Testimonial's optionality
  featured?: boolean;
  status?: "draft" | "published";
}