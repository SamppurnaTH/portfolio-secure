import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sanitize search terms to prevent NoSQL injection
export function sanitizeSearchTerm(searchTerm: string): string {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return '';
  }
  
  // Remove regex special characters that could be used for injection
  return searchTerm
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
    .trim()
    .slice(0, 100); // Limit length to prevent DoS
}

// Validate environment variables
export function validateEnvVars() {
  const requiredVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'ALLOWED_ORIGINS'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Rate limiting utility
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, { count: number; resetTime: number }>();
  
  return function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) store.delete(key);
    }
    
    const record = store.get(identifier);
    if (!record || now > record.resetTime) {
      store.set(identifier, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    record.count++;
    return { allowed: true, remaining: maxRequests - record.count };
  };
}

// Secure file validation
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  return { valid: true };
}

// Generate secure random string
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
