import { type NextRequest, NextResponse } from "next/server"
import { withCors } from '@/lib/cors'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'  // For better performance

export async function GET(request: NextRequest) {
  const apiBase = process.env.API_BASE_URL
  if (!apiBase) {
    return withCors(
      new NextResponse(
        JSON.stringify({ 
          error: 'API_BASE_URL environment variable is not configured',
          message: 'Proxy configuration error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ),
      request
    )
  }
  
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path') || 'api/dashboard'
  
  // Construct target URL safely
  const targetUrl = new URL(path, apiBase)
  searchParams.delete('path')
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value)
  })

  try {
    const res = await fetch(targetUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          Array.from(request.headers.entries())
            .filter(([key]) => 
              key.toLowerCase().startsWith('authorization') ||
              key.toLowerCase() === 'cookie'
            )
        )
      },
      credentials: 'include'
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Backend responded with ${res.status}: ${error}`)
    }

    const data = await res.json()
    
    return withCors(
      new NextResponse(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }),
      request
    )
  } catch (error: unknown) {
    return withCors(
      new NextResponse(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Proxy request failed'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ),
      request
    )
  }
}