import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 0. Get user's active context from memberships
    const { data: membership } = await supabase
      .from("memberships")
      .select("campus_id, org_id, role")
      .eq("user_id", user.id)
      .single()

    if (!membership || !["campus_manager", "super_admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filterCohortId = searchParams.get("cohortId")

    // 1. Total students
    let studentsQuery = supabase.from("students").select("id, cohort_id", { count: 'exact' })
    if (membership.org_id) {
       // Get organization students (based on orga_name if we still use it, or join memberships)
       // For now, let's stick to cohort-based filtering if provided, 
       // or everything the user has access to.
       if (membership.campus_id) {
         // Filter by campus (via cohorts)
         const { data: campusCohorts } = await supabase.from("cohorts").select("id").eq("campus_id", membership.campus_id)
         const cohortIds = campusCohorts?.map(c => c.id) || []
         studentsQuery = studentsQuery.in("cohort_id", cohortIds)
       }
    }

    if (filterCohortId && filterCohortId !== 'all') {
      studentsQuery = studentsQuery.eq("cohort_id", filterCohortId)
    }
    const { count: totalStudents } = await studentsQuery

    // 2. Presence Rate (Global or Filtered)
    let sessionIds: string[] = []
    if (filterCohortId && filterCohortId !== 'all') {
      const { data: sessions } = await supabase.from("sessions").select("id").eq("cohort_id", filterCohortId)
      sessionIds = sessions?.map(s => s.id) || []
    } else if (membership.campus_id) {
      const { data: campusCohorts } = await supabase.from("cohorts").select("id").eq("campus_id", membership.campus_id)
      const { data: sessions } = await supabase.from("sessions").select("id").in("cohort_id", campusCohorts?.map(c => c.id) || [])
      sessionIds = sessions?.map(s => s.id) || []
    }

    let globalPresenceRate = 0
    if (sessionIds.length > 0) {
      const { data: recordsData } = await supabase
        .from("records")
        .select("status")
        .in("session_id", sessionIds)

      const total = recordsData?.length || 0
      const present = recordsData?.filter(r => r.status === 'present').length || 0
      globalPresenceRate = total > 0 ? Math.round((present / total) * 100) : 0
    }

    // 3. Stats by Cohort (Distribution)
    let cohortsQuery = supabase.from("cohorts").select("id, name")
    if (membership.campus_id) {
      cohortsQuery = cohortsQuery.eq("campus_id", membership.campus_id)
    }
    const { data: cohortsList } = await cohortsQuery

    const statsByCohort = await Promise.all(
      (cohortsList || []).map(async (c) => {
        const { count } = await supabase
          .from("students")
          .select("*", { count: 'exact', head: true })
          .eq("cohort_id", c.id)
        
        return {
          label: c.name,
          id: c.id,
          count: count || 0
        }
      })
    )

    return NextResponse.json({
      totalStudents: totalStudents || 0,
      globalPresenceRate,
      statsByCohort,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error("CM Overview Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

