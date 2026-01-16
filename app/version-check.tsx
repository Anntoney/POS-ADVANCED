"use client"

import { useEffect } from "react"

export function VersionCheck() {
  useEffect(() => {
    let reloadCount = 0
    const MAX_RELOADS = 2 // Prevent infinite reload loops
    
    // Listen for "Failed to find Server Action" errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || event.error?.message || ""
      
      // Check for build mismatch errors (exclude normal redirects)
      if (
        (errorMessage.includes("Failed to find Server Action") ||
        errorMessage.includes("Cannot find module") ||
        errorMessage.includes("Module not found") ||
        errorMessage.includes("build mismatch")) &&
        !errorMessage.includes("NEXT_REDIRECT")
      ) {
        reloadCount++
        
        if (reloadCount > MAX_RELOADS) {
          console.error("Too many reload attempts, stopping to prevent infinite loop")
          return
        }
        
        console.warn("Build mismatch detected, reloading page...")
        
        // Clear all storage
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (e) {
          console.error("Error clearing storage:", e)
        }

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    }

    // Listen for unhandled promise rejections (common with Server Actions)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason) || ""
      
      if (
        (errorMessage.includes("Failed to find Server Action") ||
        errorMessage.includes("Cannot find module") ||
        errorMessage.includes("Module not found") ||
        errorMessage.includes("build mismatch")) &&
        !errorMessage.includes("NEXT_REDIRECT")
      ) {
        reloadCount++
        
        if (reloadCount > MAX_RELOADS) {
          console.error("Too many reload attempts, stopping to prevent infinite loop")
          return
        }
        
        console.warn("Build mismatch detected in promise rejection, reloading page...")
        
        // Clear all storage
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (e) {
          console.error("Error clearing storage:", e)
        }

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    }

    // Add event listeners
    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    // Cleanup
    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return null
}
