import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     * - /api/doma (public API routes that need CORS)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/doma|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}