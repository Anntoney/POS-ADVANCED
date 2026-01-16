import { updateSession } from "@/lib/supabase/proxy"
import { type NextRequest, NextResponse } from "next/server"

export default async function proxy(request: NextRequest) {
  try {
    // Use the existing updateSession function which handles most auth logic
    const response = await updateSession(request)

    // Check if updateSession already redirected
    const alreadyRedirecting = response.headers.get("location")
    
    // If already redirecting, don't do anything else to avoid loops
    if (alreadyRedirecting) {
      return response
    }

    // Only handle explicit error params if we're NOT on the login page
    // This prevents redirect loops when already on /auth/login with error param
    const errorMessage = request.nextUrl.searchParams.get("error")
    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth/login")
    
    if ((errorMessage === "refresh_token_not_found" || errorMessage === "session_expired") && !isAuthRoute) {
      // Clear cookies and redirect to login
      const allCookies = request.cookies.getAll()
      allCookies.forEach((cookie) => {
        const cookieName = cookie.name.toLowerCase()
        if (
          cookieName.includes("supabase") ||
          cookieName.includes("auth") ||
          cookieName.startsWith("sb-") ||
          cookieName.includes("access-token") ||
          cookieName.includes("refresh-token")
        ) {
          response.cookies.delete(cookie.name)
        }
      })

      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("error", "session_expired")
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error("Proxy error:", error)

    // On error, only redirect if on protected route and NOT already on login
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
                              request.nextUrl.pathname.startsWith("/pos")
    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth/login")
    
    if (isProtectedRoute && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("error", "middleware_error")
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
