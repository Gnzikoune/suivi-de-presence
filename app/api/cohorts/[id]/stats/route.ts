import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

// GET /api/cohorts/[id]/stats - Cohort statistics
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

    // 1. Get students in this cohort
    const { data: students } = await client
      .from("students")
      .select("id")
      .eq("cohort_id", id)

    const studentIds = students?.map(s => s.id) || []
    const totalStudents = studentIds.length

    // 2. Get sessions for this cohort
    const { data: sessions } = await client
      .from("sessions")
      .select("id, date, title, start_time, end_time")
      .eq("cohort_id", id)
      .order("date", { ascending: false })

    const totalSessions = sessions?.length || 0

    // 3. Calculate average presence rate
    let averagePresenceRate = 0
    let records: any[] = []
    
    if (studentIds.length > 0 && totalSessions > 0) {
      const { data } = await client
        .from("records")
        .select("student_id, status")
        .in("student_id", studentIds)
      
      records = data || []
      const totalRecords = records.length
      const presentRecords = records.filter(r => 
        r.status === 'present' || r.status === 'late'
      ).length || 0

      averagePresenceRate = totalRecords > 0
        ? Math.round((presentRecords / totalRecords) * 1000) / 10
        : 0
    }

    return NextResponse.json({
      totalStudents,
      totalSessions,
      averagePresenceRate,
      recentSessions: (sessions || []).slice(0, 5),
      allSessions: sessions || [],
      allStudents: students || [],
      allRecords: records || []
    })
  } catch (error) {
    console.error("GET cohort stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
