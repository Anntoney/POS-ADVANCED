"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { LoadingDialog } from "@/components/ui/loading-dialog"

type NavigationLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  pageName?: string
}

export function NavigationLink({ href, children, className, onClick, pageName }: NavigationLinkProps) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [targetPath, setTargetPath] = useState<string | null>(null)

  useEffect(() => {
    // Hide loading when pathname changes to the target path
    if (isNavigating && targetPath && pathname === targetPath) {
      setIsNavigating(false)
      setTargetPath(null)
    }
  }, [pathname, isNavigating, targetPath])

  useEffect(() => {
    // Cleanup timeout on unmount
    let timeoutId: NodeJS.Timeout | null = null
    
    if (isNavigating) {
      // Fallback: hide loading after a timeout in case navigation doesn't complete
      timeoutId = setTimeout(() => {
        setIsNavigating(false)
        setTargetPath(null)
      }, 5000)
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isNavigating])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't show loading if clicking the same page
    if (pathname === href) {
      if (onClick) onClick()
      return
    }

    setIsNavigating(true)
    setTargetPath(href)
    
    if (onClick) onClick()
  }

  const loadingMessage = pageName ? `Loading ${pageName}...` : "Loading page..."

  return (
    <>
      <Link
        href={href}
        onClick={handleClick}
        className={className}
      >
        {children}
      </Link>
      <LoadingDialog 
        isOpen={isNavigating} 
        message={loadingMessage}
      />
    </>
  )
}
