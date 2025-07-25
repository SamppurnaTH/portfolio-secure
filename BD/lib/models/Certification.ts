import type { ObjectId } from "mongodb";

// ✅ MongoDB document shape (after insertion)
export interface Certification {
  _id?: ObjectId;          // MongoDB ObjectId (auto-generated)
  title: string;
  organization: string;    // Issuing body
  issueDate: string;       // Format: YYYY-MM or YYYY
  description?: string;    // Optional details about the cert
  badge: string;           // Emoji or icon
  color: string;           // Tailwind gradient class or theme
  credentialId?: string;   // Optional ID to verify cert
  link?: string;           // Optional public verification URL
  views?: number;          // <--- ADD THIS LINE: Optional for now, but will become mandatory if backend tracks it
  createdAt: Date;         // Server-generated timestamp
  updatedAt: Date;         // Server-generated timestamp
}

// ✅ Input shape expected from frontend form
export interface CertificationInput {
  title: string;
  organization: string;
  issueDate: string;
  description?: string;
  badge: string;
  color: string;
  credentialId?: string;
  link?: string;
  // No 'views' field needed in input as it's backend-managed
}