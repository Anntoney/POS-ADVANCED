import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // SIMPLIFIED: Only refresh session, let pages/layouts handle redirects
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

  // Only check for refresh token errors to clear cookies
  // Don't do any redirects - let pages handle their own auth checks
  try {
    const { error: authError } = await supabase.auth.getUser()
    
    // Only handle refresh token errors by clearing cookies
    if (authError) {
      const errorMessage = authError.message?.toLowerCase() || ""
      const errorCode = authError.code || ""
      
      if (
        errorMessage.includes("refresh_token_not_found") ||
        errorMessage.includes("invalid refresh token") ||
        errorMessage.includes("jwt expired") ||
        errorMessage.includes("session not found") ||
        errorCode === "refresh_token_not_found"
      ) {
        // Clear all Supabase cookies silently
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
      }
    }
  } catch (error: any) {
    // Silently handle any errors - just clear cookies if it's a refresh token error
    const errorMessage = error?.message?.toLowerCase() || ""
    const errorCode = error?.code || ""
    
    if (
      errorMessage.includes("refresh_token_not_found") ||
      errorMessage.includes("invalid refresh token") ||
      errorCode === "refresh_token_not_found"
    ) {
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
          supabaseResponse.cookies.delete(cookie.name)
        }
      })
    }
  }

  // Just return - let the pages/layouts handle redirects
  return supabaseResponse
}
