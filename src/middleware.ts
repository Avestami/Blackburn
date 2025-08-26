import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')
    const isPublicApiRoute = req.nextUrl.pathname.startsWith('/api/public')
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')
    
    // Allow all API routes to handle their own authentication
    if (isApiRoute) {
      return NextResponse.next()
    }

    // Redirect to signin if not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPage) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Redirect to dashboard if authenticated and trying to access auth pages
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Check admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!token?.role || !['ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Restrict admin users to only admin panel and profile/settings
    if (token?.role && ['ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
      const allowedPaths = ['/admin', '/profile', '/settings', '/api', '/dashboard']
      const currentPath = req.nextUrl.pathname
      
      // Check if current path is allowed for admin users
      const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path))
      
      // Redirect admin users away from restricted pages
      if (!isAllowedPath && currentPath !== '/') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      
      // Redirect admin users from root to admin panel (but allow dashboard access)
      if (currentPath === '/') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => {
        // This callback is called for every request
        // Return true to allow the request, false to redirect to signin
        return true // We handle authorization in the middleware function above
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}