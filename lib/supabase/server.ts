import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Safely get user with error handling for refresh token errors
 * Use this in Server Components instead of directly calling supabase.auth.getUser()
 */
export async function getServerUser() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    
    // Check for refresh token errors
    if (error) {
      const errorMessage = error.message?.toLowerCase() || ""
      const errorCode = error.code || ""
      
      if (
        errorMessage.includes("refresh_token_not_found") ||
        errorMessage.includes("invalid refresh token") ||
        errorCode === "refresh_token_not_found"
      ) {
        // Clear invalid cookies
        try {
          const cookieStore = await cookies()
          const allCookies = cookieStore.getAll()
          allCookies.forEach((cookie) => {
            const cookieName = cookie.name.toLowerCase()
            if (
              cookieName.includes("supabase") ||
              cookieName.includes("auth") ||
              cookieName.startsWith("sb-") ||
              cookieName.includes("access-token") ||
              cookieName.includes("refresh-token")
            ) {
              cookieStore.delete(cookie.name)
            }
          })
        } catch (clearError) {
          // Ignore errors when clearing cookies
        }
        
        // Return null user to trigger redirect
        return { user: null, error }
      }
    }
    
    return { user: data.user, error }
  } catch (error: any) {
    // Catch any thrown errors (like from token refresh)
    const errorMessage = error?.message?.toLowerCase() || ""
    const errorCode = error?.code || ""
    
    if (
      errorMessage.includes("refresh_token_not_found") ||
      errorMessage.includes("invalid refresh token") ||
      errorCode === "refresh_token_not_found"
    ) {
      // Clear invalid cookies
      try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        allCookies.forEach((cookie) => {
          const cookieName = cookie.name.toLowerCase()
          if (
            cookieName.includes("supabase") ||
            cookieName.includes("auth") ||
            cookieName.startsWith("sb-") ||
            cookieName.includes("access-token") ||
            cookieName.includes("refresh-token")
          ) {
            cookieStore.delete(cookie.name)
          }
        })
      } catch (clearError) {
        // Ignore errors when clearing cookies
      }
      
      return {
        user: null,
        error: {
          message: "Refresh token not found",
          status: 400,
          code: "refresh_token_not_found",
        },
      }
    }
    
    // Re-throw other errors
    throw error
  }
}
