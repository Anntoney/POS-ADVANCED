import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get request body
    const { email, password, fullName, role } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Use admin client for user creation (bypasses email verification)
    const adminClient = createAdminClient()

    // Check if user already exists
    const { data: existingUser } = await adminClient.auth.admin.listUsers()
    const userExists = existingUser?.users?.some((u) => u.email === email)

    if (userExists) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Create user using admin API (bypasses email confirmation)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: role || "cashier",
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Wait a moment for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Update or create profile with additional details
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: role || "cashier",
        is_active: true,
        store_id: null,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Profile error:", profileError)
      // Try to delete the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    // Create default permissions (all enabled for new users)
    const FEATURES = [
      "dashboard",
      "pos",
      "products",
      "categories",
      "stock",
      "stock_transfer",
      "sales",
      "purchases",
      "returns",
      "customers",
      "suppliers",
      "credit",
      "quotations",
      "expenses",
      "reports",
      "settings",
    ]

    const defaultPermissions = FEATURES.map((feature) => ({
      user_id: authData.user.id,
      feature: feature,
      can_access: true,
    }))

    const { error: permError } = await adminClient.from("user_permissions").insert(defaultPermissions)

    if (permError) {
      console.error("Permissions error:", permError)
      // Don't fail, permissions can be set later
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      message: "Account created successfully",
    })
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
