import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

// GET /api/cohorts/[id] - Get cohort detail with relations
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isSuperAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'
    const client = isSuperAdmin ? await createAdminClient() : supabase

    // Fetch cohort with campus info
    const { data: cohort, error } = await client
      .from("cohorts")
      .select("*, campuses(id, name)")
      .eq("id", id)
      .single()

    if (error || !cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 })
    }

    // Count students in this cohort
    const { count: studentCount } = await client
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("cohort_id", id)

    // Count sessions for this cohort
    const { count: sessionCount } = await client
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("cohort_id", id)

    return NextResponse.json({
      ...cohort,
      studentCount: studentCount || 0,
      sessionCount: sessionCount || 0
    })
  } catch (error) {
    console.error("GET cohort detail error:", error)
    return NextResponse.json({ error: "Failed to fetch cohort" }, { status: 500 })
  }
}

// PATCH /api/cohorts/[id] - Update cohort
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isSuperAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'
    
    // Check permissions
    if (!isSuperAdmin) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id)
        .single()
      if (membership?.role !== 'campus_manager') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const body = await req.json()
    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.campusId !== undefined) updates.campus_id = body.campusId
    if (body.startDate !== undefined) updates.start_date = body.startDate
    if (body.endDate !== undefined) updates.end_date = body.endDate

    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from("cohorts")
      .update(updates)
      .eq("id", id)
      .select("*, campuses(id, name)")
      .single()

    if (error) throw error

    await logAudit(user.id, 'UPDATE_COHORT', `Modification de la cohorte: ${data.name}`, 'cohort', id)

    return NextResponse.json(data)
  } catch (error) {
    console.error("PATCH cohort error:", error)
    return NextResponse.json({ error: "Failed to update cohort" }, { status: 500 })
  }
}

// DELETE /api/cohorts/[id] - Delete cohort with cascade options
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const isSuperAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'

    if (!isSuperAdmin) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id)
        .single()
      if (membership?.role !== 'campus_manager') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const adminClient = await createAdminClient()
    const { searchParams } = new URL(req.url)
    const cascade = searchParams.get("cascade") === "true"

    // Fetch cohort name for logging
    const { data: cohort } = await adminClient
      .from("cohorts")
      .select("name")
      .eq("id", id)
      .single()

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 })
    }

    if (cascade) {
      // Delete students in this cohort
      await adminClient.from("students").delete().eq("cohort_id", id)
    } else {
      // Detach students (set cohort_id to null)
      await adminClient.from("students").update({ cohort_id: null }).eq("cohort_id", id)
    }

    // Delete sessions (always cascade - sessions are meaningless without cohort)
    await adminClient.from("sessions").delete().eq("cohort_id", id)

    // Delete the cohort itself
    const { error } = await adminClient.from("cohorts").delete().eq("id", id)
    if (error) throw error

    await logAudit(user.id, 'DELETE_COHORT', `Suppression de la cohorte: ${cohort.name}${cascade ? ' (avec apprenants)' : ' (apprenants détachés)'}`, 'cohort', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE cohort error:", error)
    return NextResponse.json({ error: "Failed to delete cohort" }, { status: 500 })
  }
}
