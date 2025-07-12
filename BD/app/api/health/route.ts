import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  try {
    return withCors(
      NextResponse.json(
        { 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          service: 'portfolio-backend'
        },
        { status: 200 }
      ),
      request
    )
  } catch (error) {
    return withCors(
      NextResponse.json(
        { 
          status: 'unhealthy', 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      ),
      request
    )
  }
} 