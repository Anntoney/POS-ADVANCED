import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create users" }, { status: 403 })
    }

    // Get request body
    const { email, password, fullName, role, storeId, isActive } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Use admin client for user creation
    const adminClient = createAdminClient()

    // Create user using admin API (bypasses email confirmation)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: role,
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

    // Update or create profile with additional details using admin client
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: role,
        is_active: isActive,
        store_id: storeId,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Profile error:", profileError)
      // Try to delete the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      message: "User created successfully",
    })
  } catch (error: any) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
