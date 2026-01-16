import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Early return for login page to avoid unnecessary processing and potential loops
  const isLoginPage = request.nextUrl.pathname === "/auth/login"
  if (isLoginPage) {
    // Still need to refresh session, but don't do redirects
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // Only redirect authenticated users away from login (not if there's an error param)
    const hasErrorParam = request.nextUrl.searchParams.has("error")
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (user && !authError && !hasErrorParam) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      url.searchParams.delete("error") // Remove error param if present
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  let authError = null

  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
    authError = result.error
  } catch (error: any) {
    // Catch any thrown errors (like refresh_token_not_found)
    authError = error
  }

  // Check if it's a refresh token error (from error or catch)
  const errorMessage = authError?.message?.toLowerCase() || ""
  const errorCode = authError?.code || ""
  const isRefreshTokenError = authError && (
    errorMessage.includes("refresh_token_not_found") ||
    errorMessage.includes("invalid refresh token") ||
    errorMessage.includes("jwt expired") ||
    errorMessage.includes("session not found") ||
    errorCode === "refresh_token_not_found"
  )

  // If user is authenticated, just let them through - don't check errors
  // The dashboard layout will handle auth checks
  if (user && !isRefreshTokenError) {
    // User is authenticated, allow request
    // Only redirect authenticated users away from auth pages
    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth")
    const hasErrorParam = request.nextUrl.searchParams.has("error")
    
    if (isAuthRoute && !request.nextUrl.pathname.includes("/auth/error") && !hasErrorParam) {
      // Redirect authenticated users away from auth pages
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
    
    return supabaseResponse
  }

  // Handle refresh token errors - clear cookies and redirect
  if (isRefreshTokenError) {
    // Clear all Supabase cookies
    const allCookies = request.cookies.getAll()
    allCookies.forEach((cookie) => {
      const cookieName = cookie.name.toLowerCase()
      if (
        cookieName.includes("supabase") ||
        cookieName.includes("auth") ||
        cookieName.startsWith("sb-") ||
        cookieName.includes("access-token") ||
        cookieName.includes("refresh-token") ||
        cookieName.includes("code-verifier") ||
        cookieName.includes("code-challenge")
      ) {
        supabaseResponse.cookies.delete(cookie.name)
      }
    })

    // Redirect to login if on protected route
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
                              request.nextUrl.pathname.startsWith("/pos")
    
    if (isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("error", "session_expired")
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // Redirect to login if accessing protected routes without authentication
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
                            request.nextUrl.pathname.startsWith("/pos")
  const isLoginPage = request.nextUrl.pathname === "/auth/login"
  const hasErrorParam = request.nextUrl.searchParams.has("error")
  
  if (isProtectedRoute && !user && !isLoginPage && !hasErrorParam) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
