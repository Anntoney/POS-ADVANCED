"use client"

import { Bell, Search, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

export function Header({ title, showMenu = false }: { title: string; showMenu?: boolean }) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-gradient-to-r from-background via-primary/5 to-background px-6 shadow-sm" suppressHydrationWarning>
      {showMenu && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 hover:bg-primary/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}
      <h1 className="text-3xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{title}</h1>
      <div className="ml-auto flex items-center gap-4" suppressHydrationWarning>
        <div className="relative hidden md:block" suppressHydrationWarning>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="w-64 pl-8 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-accent text-accent-foreground border-2 border-background">3</Badge>
        </Button>
      </div>
    </header>
  )
}
