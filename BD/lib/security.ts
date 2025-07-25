// lib/security.ts
import { NextRequest } from "next/server";

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 50,
    CHATBOT_WINDOW_MS: 15 * 60 * 1000,
    CHATBOT_MAX_REQUESTS: 50,
  },
  
  // File upload
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  
  // Authentication
  AUTH: {
    TOKEN_EXPIRY: '7d',
    PASSWORD_MIN_LENGTH: 6,
    SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  // CORS
  CORS: {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  
  // Input validation
  VALIDATION: {
    MAX_SEARCH_LENGTH: 100,
    MAX_TITLE_LENGTH: 200,
    MAX_CONTENT_LENGTH: 10000,
    MAX_DESCRIPTION_LENGTH: 500,
  }
};

// Security headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

// IP address extraction with security considerations
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  // Prioritize Cloudflare IP if available
  if (cfConnectingIP) {
    return cfConnectingIP.split(',')[0].trim();
  }
  
  // Use X-Forwarded-For but take the first IP (client IP)
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback to X-Real-IP
  if (realIP) {
    return realIP.split(',')[0].trim();
  }
  
  return 'unknown';
}

// Validate and sanitize search parameters
export function sanitizeSearchParams(params: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    if (value && typeof value === 'string') {
      // Limit length and remove dangerous characters
      const sanitizedValue = value
        .trim()
        .slice(0, SECURITY_CONFIG.VALIDATION.MAX_SEARCH_LENGTH)
        .replace(/[<>]/g, ''); // Remove potential HTML tags
      
      if (sanitizedValue) {
        sanitized[key] = sanitizedValue;
      }
    }
  }
  
  return sanitized;
}

// Validate file upload
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB limit`
    };
  }
  
  // Check MIME type
  if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
    };
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().split('.').pop();
  if (!extension || !SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(`.${extension}`)) {
    return {
      valid: false,
      error: 'Invalid file extension'
    };
  }
  
  return { valid: true };
}

// Content Security Policy
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://openrouter.ai",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://openrouter.ai https://api.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}

// Validate environment variables
export function validateEnvironment(): void {
  const required = [
    'JWT_SECRET',
    'MONGODB_URI',
    'ALLOWED_ORIGINS'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate MongoDB URI format
  const mongoUri = process.env.MONGODB_URI!;
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MongoDB URI format');
  }
} 