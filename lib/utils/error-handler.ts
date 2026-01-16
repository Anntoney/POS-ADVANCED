/**
 * Global error handler for Supabase auth errors
 * This prevents unhandled promise rejections from cluttering logs
 */

if (typeof process !== "undefined") {
  // Handle unhandled promise rejections (common with Supabase auth errors)
  process.on("unhandledRejection", (reason: any, promise) => {
    // Check if it's a Supabase auth error
    const errorMessage = reason?.message?.toLowerCase() || ""
    const errorCode = reason?.code || ""
    const errorName = reason?.name || ""

    // Suppress refresh_token_not_found errors - they're handled by proxy
    if (
      errorName === "AuthApiError" &&
      (errorMessage.includes("refresh_token_not_found") ||
        errorMessage.includes("invalid refresh token") ||
        errorCode === "refresh_token_not_found")
    ) {
      // Silently handle - these are expected when tokens expire
      // The proxy will handle clearing cookies and redirecting
      return
    }

    // Log other unhandled rejections
    console.error("Unhandled Rejection:", reason)
  })

  // Handle uncaught exceptions
  process.on("uncaughtException", (error: any) => {
    const errorMessage = error?.message?.toLowerCase() || ""
    const errorCode = error?.code || ""
    const errorName = error?.name || ""

    // Suppress refresh_token_not_found errors
    if (
      errorName === "AuthApiError" &&
      (errorMessage.includes("refresh_token_not_found") ||
        errorMessage.includes("invalid refresh token") ||
        errorCode === "refresh_token_not_found")
    ) {
      // Silently handle - these are expected when tokens expire
      return
    }

    // Log other uncaught exceptions
    console.error("Uncaught Exception:", error)
  })
}
