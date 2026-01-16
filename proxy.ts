import { updateSession } from "@/lib/supabase/proxy"
import { type NextRequest, NextResponse } from "next/server"

export default async function proxy(request: NextRequest) {
  try {
    // Use the existing updateSession function which handles most auth logic
    const response = await updateSession(request)

    // Only handle additional error cases if updateSession didn't already redirect
    const errorMessage = request.nextUrl.searchParams.get("error")
    const alreadyRedirecting = response.headers.get("location")
    
    // Handle explicit error params only if not already redirecting
    if ((errorMessage === "refresh_token_not_found" || errorMessage === "session_expired") && !alreadyRedirecting) {
      const isAuthRoute = request.nextUrl.pathname.startsWith("/auth/login")
      
      if (!isAuthRoute) {
        // Clear cookies and redirect
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
    }

    return response
  } catch (error) {
    console.error("Proxy error:", error)

    // On error, only redirect if on protected route
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
                              request.nextUrl.pathname.startsWith("/pos")
    
    if (isProtectedRoute) {
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
