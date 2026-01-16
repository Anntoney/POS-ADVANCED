import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect authenticated users to dashboard, unauthenticated to login
  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Point of Sale System</h1>
        <p className="text-lg text-muted-foreground">
          Complete business management solution with inventory, sales, purchases, and reporting
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/login">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
