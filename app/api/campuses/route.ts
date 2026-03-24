import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function GET() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get user's role - check profile first, then metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // Prioritize role from profile, fallback to user_metadata
    const userRole = profile?.role || user.user_metadata?.role
    const isSuperAdmin = userRole === 'super_admin'

    if (isSuperAdmin) {
      const adminSupabase = await createAdminClient()
      const { data, error } = await adminSupabase
        .from("campuses")
        .select("*")
        .order("name")
      if (error) throw error
      return NextResponse.json(data)
    }

    // Get user's active membership for regular users
    const { data: membership } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .single()

    if (!membership?.org_id) return NextResponse.json([])

    const { data, error } = await supabase
      .from("campuses")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("name")

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET campuses error:", error)
    return NextResponse.json({ error: "Failed to fetch campuses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Get user role - check profile first, then metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isGlobalAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'
    
    // 2. Get organization context (Membership)
    const { data: membership, error: memberError } = await supabase
      .from("memberships")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single()
    
    if (memberError && memberError.code !== 'PGRST116') {
      console.error("POST campuses error fetching membership:", memberError)
      throw memberError
    }

    if (!isGlobalAdmin && membership?.role !== 'campus_manager') {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: "Campus name is required" }, { status: 400 })

    const targetOrgId = membership?.org_id || null

    const { data, error } = await adminSupabase
      .from("campuses")
      .insert({
        name,
        org_id: targetOrgId
      })
      .select()
      .single()

    if (error) {
      console.error("POST campuses error during insertion:", error)
      throw error
    }

    await logAudit(user.id, 'CREATE_CAMPUS', `Création de campus: ${name}`, 'campus', data.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error("POST campuses error:", error)
    return NextResponse.json({ error: "Failed to create campus" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isGlobalAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'
    
    // 2. Get organization context
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (!isGlobalAdmin && membership?.role !== 'campus_manager') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Fetch campus name for audit
    const { data: campus } = await adminSupabase
      .from("campuses")
      .select("name")
      .eq("id", id)
      .single()

    if (!campus) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { error } = await adminSupabase
      .from("campuses")
      .delete()
      .eq("id", id)

    if (error) throw error

    await logAudit(user.id, 'DELETE_CAMPUS', `Suppression du campus: ${campus.name}`, 'campus', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE campuses error:", error)
    return NextResponse.json({ error: "Failed to delete campus" }, { status: 500 })
  }
}
