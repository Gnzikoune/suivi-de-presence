import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function GET(req: Request) {
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

    const isSuperAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'
    let queryData: any[] = []

    if (isSuperAdmin) {
      const adminSupabase = await createAdminClient()
      const { data, error } = await adminSupabase
        .from("cohorts")
        .select("*, campuses(name)")
      if (error) throw error
      queryData = data || []
    } else {
      // Get user's active membership for regular users
      const { data: membership } = await supabase
        .from("memberships")
        .select("campus_id, org_id")
        .eq("user_id", user.id)
        .single()

      if (!membership) return NextResponse.json([])

      let query = supabase.from("cohorts").select("*, campuses(name)")
      if (membership.campus_id) {
         query = query.eq("campus_id", membership.campus_id)
      } else if (membership.org_id) {
         const { data: campuses } = await supabase.from("campuses").select("id").eq("org_id", membership.org_id)
         const campusIds = campuses?.map(c => c.id) || []
         query = query.in("campus_id", campusIds)
      }
      
      const { data, error } = await query
      if (error) throw error
      queryData = data || []
    }

    return NextResponse.json(queryData)
  } catch (error) {
    console.error("GET cohorts error:", error)
    return NextResponse.json({ error: "Failed to fetch cohorts" }, { status: 500 })
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
      .select("role, orga_name")
      .eq("id", user.id)
      .single()

    const isGlobalAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'
    
    let isAllowed = isGlobalAdmin
    if (!isAllowed) {
      const { data: member } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id)
        .single()
      isAllowed = member?.role === 'campus_manager' || member?.role === 'super_admin'
    }

    if (!isAllowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const { name, campusId, startDate, endDate } = body

    if (!name || !campusId) {
      return NextResponse.json({ error: "Nom et Campus requis" }, { status: 400 })
    }

    const { data, error } = await adminSupabase
      .from("cohorts")
      .insert({
        name,
        campus_id: campusId,
        start_date: startDate,
        end_date: endDate
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase Error (POST cohorts):", error)
      throw error
    }

    // Log action
    await logAudit(user.id, 'CREATE_COHORT', `Création de cohorte: ${name}`, 'cohort', data.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error("POST cohorts error:", error)
    return NextResponse.json({ error: "Failed to create cohort" }, { status: 500 })
  }
}
