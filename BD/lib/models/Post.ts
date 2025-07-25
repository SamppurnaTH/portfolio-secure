// B:\Portfolio\BD\lib\models\Post.ts

import type { ObjectId } from "mongodb";


export interface Post {
  _id?: ObjectId;              
  title: string;
  slug: string;                 
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  image: string;                
  featured: boolean;
  status: "draft" | "published"; 
  createdAt: Date;             // <-- ALREADY HERE! Important for monthly stats
  updatedAt: Date;              
  views: number;               // <-- ALREADY HERE! Important for live views
  likes: number;           
  comments: number;             
  readTime: string;
}


export interface PostInput {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  image: string;               
  featured?: boolean;           
  status?: "draft" | "published"; 
  readTime: string;
  
}