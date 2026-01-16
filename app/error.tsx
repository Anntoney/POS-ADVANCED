"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    // Log error for debugging
    console.error("Error boundary caught:", error)
  }, [error])

  const clearSessionAndRetry = async () => {
    setIsClearing(true)
    try {
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear all cookies (client-side)
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        // Clear Supabase-related cookies
        if (
          name.includes("supabase") ||
          name.includes("auth") ||
          name.includes("sb-")
        ) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      })

      // Check if it's an auth-related error
      const errorMessage = error.message?.toLowerCase() || ""
      const isAuthError =
        errorMessage.includes("refresh_token_not_found") ||
        errorMessage.includes("invalid refresh token") ||
        errorMessage.includes("jwt expired") ||
        errorMessage.includes("session not found") ||
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("authentication") ||
        error.digest?.includes("auth")

      if (isAuthError) {
        // Redirect to login
        router.push("/auth/login?error=session_expired")
      } else {
        // Reload the page
        window.location.reload()
      }
    } catch (clearError) {
      console.error("Error clearing session:", clearError)
      // Still try to reload
      window.location.reload()
    } finally {
      setIsClearing(false)
    }
  }

  const isAuthError =
    error.message?.toLowerCase().includes("refresh_token_not_found") ||
    error.message?.toLowerCase().includes("invalid refresh token") ||
    error.message?.toLowerCase().includes("jwt expired") ||
    error.message?.toLowerCase().includes("session not found") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("authentication") ||
    error.digest?.includes("auth")

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            {isAuthError
              ? "Your session has expired. Please sign in again."
              : "An unexpected error occurred. We'll help you fix it."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {process.env.NODE_ENV === "development" && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-mono text-muted-foreground break-all">
                  {error.message || "Unknown error"}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {isAuthError
                ? "Your authentication session is no longer valid. Click the button below to clear your session and sign in again."
                : "This might be due to a build mismatch or cached data. Click the button below to clear your session and reload."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={clearSessionAndRetry}
            disabled={isClearing}
            className="w-full"
            size="lg"
          >
            {isClearing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Clearing session...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isAuthError ? "Clear Session and Sign In" : "Clear Session and Retry"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
          {process.env.NODE_ENV === "development" && (
            <Button variant="ghost" onClick={reset} className="w-full">
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
