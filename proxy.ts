import { updateSession } from "@/lib/supabase/proxy"
import { type NextRequest, NextResponse } from "next/server"

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // ABSOLUTELY NO REDIRECTS if already on /dashboard - just refresh session and return
  if (pathname.startsWith("/dashboard")) {
    const response = await updateSession(request)
    return response
  }
  
  try {
    // Use the existing updateSession function - it only refreshes sessions, no redirects
    const response = await updateSession(request)

    // Check if updateSession already redirected (it shouldn't, but just in case)
    const alreadyRedirecting = response.headers.get("location")
    if (alreadyRedirecting) {
      return response
    }

    // Only handle explicit error params if we're NOT on the login page
    const errorMessage = request.nextUrl.searchParams.get("error")
    const isOnLoginPage = pathname === "/auth/login"
    
    // Only redirect if we have an error AND we're NOT already on login page
    if ((errorMessage === "refresh_token_not_found" || errorMessage === "session_expired") && !isOnLoginPage) {
      // Clear cookies and redirect to login ONLY if not already there
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

    // No redirects - just return the response
    return response
  } catch (error) {
    console.error("Proxy error:", error)
    
    // On error, don't redirect - let pages handle it
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
