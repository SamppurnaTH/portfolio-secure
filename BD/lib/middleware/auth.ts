// B:\Portfolio\BD\lib\middleware\auth.ts
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../auth"; // Assuming this is where verifyToken is defined
import { withCors } from "../cors";

// First, define the DecodedToken interface locally since it's not exported from auth.ts
interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Route context type
export type NextRouteContext = {
  params: { [key: string]: string | string[] };
};

// Extend NextRequest with properly typed user data
export interface AuthenticatedRequest extends NextRequest {
  user: DecodedToken;
}

// Token extraction utility
function extractToken(request: NextRequest): string | null {
  return (
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    request.cookies.get("auth-token")?.value ||
    null
  );
}

// Simplified auth wrapper without generics to avoid type complexity
export function withAuth(
  handler: (req: AuthenticatedRequest, ctx: NextRouteContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: NextRouteContext) => {
    try {
      // --- REMOVED THE if (request.method === 'OPTIONS') BLOCK HERE ---
      // The OPTIONS handling should be done at the route.ts level (export function OPTIONS)
      // to avoid conflicts and ensure proper CORS preflight responses.

      const token = extractToken(request);

      if (!token) {
        return withCors(
          NextResponse.json(
            { success: false, message: "Authorization token required" },
            { status: 401 }
          ),
          request
        );
      }

      const decoded = verifyToken(token) as DecodedToken | null;

      if (!decoded) {
        return withCors(
          NextResponse.json(
            { success: false, message: "Invalid or expired token" },
            { status: 401 }
          ),
          request
        );
      }

      const authenticatedRequest = Object.assign(request, {
        user: decoded,
      }) as AuthenticatedRequest;

      const response = await handler(authenticatedRequest, context);
      return withCors(response, request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      const statusCode = error instanceof Error && (errorMessage.includes("token") || errorMessage.includes("invalid")) ? 401 : 500;

      return withCors(
        NextResponse.json(
          {
            success: false,
            message: errorMessage
          },
          { status: statusCode }
        ),
        request
      );
    }
  };
}

// Admin-only wrapper
export function requireAdmin(
  handler: (req: AuthenticatedRequest, ctx: NextRouteContext) => Promise<NextResponse>
) {
  return withAuth(async (request, context) => {
    if (request.user?.role !== "admin") {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Administrator privileges required"
          },
          { status: 403 }
        ),
        request
      );
    }
    return handler(request, context);
  });
}
