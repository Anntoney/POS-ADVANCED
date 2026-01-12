"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" className="w-full justify-start" disabled>
        <Sun className="mr-3 h-5 w-5" />
        <span className="flex-1">Theme</span>
      </Button>
    )
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon className="mr-3 h-5 w-5" />
      case "light":
        return <Sun className="mr-3 h-5 w-5" />
      default:
        return <Monitor className="mr-3 h-5 w-5" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case "dark":
        return "Dark"
      case "light":
        return "Light"
      default:
        return "System"
    }
  }

  return (
    <div className="px-3 py-2" suppressHydrationWarning>
      <div className="flex items-center gap-3 text-base font-medium text-muted-foreground mb-2 px-1">
        Theme
      </div>
      <div suppressHydrationWarning>
        <Select value={theme || "system"} onValueChange={(value) => setTheme(value)}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              {getThemeIcon()}
              <SelectValue placeholder="Select theme">
                {getThemeLabel()}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
          <SelectItem value="light">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </div>
          </SelectItem>
          <SelectItem value="system">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </div>
          </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

