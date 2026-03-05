import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

// GET: List all users
export async function GET() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only Super Admin can list users
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || !profile || profile.role !== 'super_admin') {
      console.warn("Unauthorized user list attempt:", user.id, profileError)
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Fetch all users
    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) throw error

    // Fetch formations to map labels dynamically (fix for missing formation_label)
    const { data: formations } = await supabase
      .from("formations")
      .select("value, label")

    const formationsMap = (formations || []).reduce((acc: any, f) => {
      acc[f.value] = f.label
      return acc
    }, {})

    const usersWithLabels = users.map(u => ({
      ...u,
      formation_label: u.formation_label || formationsMap[u.formation] || null
    }))

    return NextResponse.json(usersWithLabels)
  } catch (error) {
    console.error("Users GET Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH: Update user role
export async function PATCH(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check permissions
    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (adminError || !adminProfile || adminProfile.role !== 'super_admin') {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { userId, role } = await req.json()
    if (!userId || !role) return NextResponse.json({ error: "ID and role required" }, { status: 400 })

    const { data, error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    // Log the change
    await logAudit(
      user.id, 
      'CHANGE_ROLE', 
      `Changement de rôle pour ${data.full_name || data.email} -> ${role}`,
      'profile',
      data.id
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error("User PATCH Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE: Delete a user
export async function DELETE(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check permissions
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (adminProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("id")
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })

    // Fetch user info for audit before deletion
    const { data: userToDelete } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single()
    
    const adminClient = await createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) throw deleteError

    // Ensure profile is gone
    await supabase.from("profiles").delete().eq("id", userId)

    // Log the deletion
    await logAudit(
      user.id, 
      'DELETE_USER', 
      `Suppression de l'utilisateur: ${userToDelete?.full_name || userToDelete?.email || userId}`,
      'profile',
      userId
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("User DELETE Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
