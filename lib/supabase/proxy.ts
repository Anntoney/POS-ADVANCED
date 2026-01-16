import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
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
    const errorMessage = error?.message?.toLowerCase() || ""
    const errorCode = error?.code || ""

    // Check if it's a refresh token error
    if (
      errorMessage.includes("refresh_token_not_found") ||
      errorMessage.includes("invalid refresh token") ||
      errorCode === "refresh_token_not_found"
    ) {
      // Clear all Supabase cookies more aggressively
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

      // Add error header for middleware to detect
      supabaseResponse.headers.set("x-supabase-auth-error", error.message || "Refresh token not found")

      // Redirect to login if on protected route
      if (
        (request.nextUrl.pathname.startsWith("/dashboard") ||
          request.nextUrl.pathname.startsWith("/pos")) &&
        request.nextUrl.pathname !== "/auth/login"
      ) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        url.searchParams.set("error", "session_expired")
        return NextResponse.redirect(url)
      }
    }
  }

  // Handle specific auth errors from the result
  if (authError) {
    // Check for refresh_token_not_found or similar session errors
    const errorMessage = authError.message?.toLowerCase() || ""
    const errorCode = authError.code || ""
    if (
      errorMessage.includes("refresh_token_not_found") ||
      errorMessage.includes("invalid refresh token") ||
      errorMessage.includes("jwt expired") ||
      errorMessage.includes("session not found") ||
      errorCode === "refresh_token_not_found"
    ) {
      // Clear all Supabase cookies more aggressively
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

      // Add error header for middleware to detect
      supabaseResponse.headers.set("x-supabase-auth-error", authError.message || "Refresh token not found")

      // Redirect to login if on protected route
      if (
        (request.nextUrl.pathname.startsWith("/dashboard") ||
          request.nextUrl.pathname.startsWith("/pos")) &&
        request.nextUrl.pathname !== "/auth/login"
      ) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        url.searchParams.set("error", "session_expired")
        return NextResponse.redirect(url)
      }
    }
  }

  // Redirect to login if accessing protected routes without authentication
  if ((request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/pos")) && (!user || authError)) {
    // Avoid redirect loop - only redirect if not already going to login
    if (request.nextUrl.pathname !== "/auth/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }
  }

  // Redirect authenticated users away from auth pages (except error page)
  if (request.nextUrl.pathname.startsWith("/auth") && user && !authError && !request.nextUrl.pathname.includes("/auth/error")) {
    // Avoid redirect loop - only redirect if not already on dashboard
    if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
