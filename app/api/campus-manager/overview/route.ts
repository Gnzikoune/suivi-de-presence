import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is campus_manager or super_admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["campus_manager", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filterFormation = searchParams.get("formation")

    // Aggregate data for Campus Manager
    // 1. Total students (filtered by formation if provided)
    let studentsQuery = supabase.from("students").select("id, formation", { count: 'exact' })
    if (filterFormation && filterFormation !== 'all') {
      studentsQuery = studentsQuery.eq("formation", filterFormation)
    }
    const { data: students, count: totalStudents } = await studentsQuery

    // 2. Average Presence Rate
    // We need to filter records by the list of students if a formation is selected
    let recordsQuery = supabase.from("records").select("present, student_id")
    
    if (filterFormation && filterFormation !== 'all' && students) {
      const studentIds = students.map(s => s.id)
      recordsQuery = recordsQuery.in("student_id", studentIds)
    }
    
    const { data: recordsData } = await recordsQuery

    const totalRecords = recordsData?.length || 0
    const presentRecords = recordsData?.filter((r: { present: boolean }) => r.present).length || 0
    const globalPresenceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

    // 3. Stats by Formation (Always return full list for the breakdown charts)
    const { data: formations } = await supabase
      .from("formations")
      .select("*")

    const statsByFormation = await Promise.all(
      (formations || []).map(async (f: { label: string, value: string }) => {
        const { count } = await supabase
          .from("students")
          .select("*", { count: 'exact', head: true })
          .eq("formation", f.value)
        
        return {
          label: f.label,
          value: f.value,
          count: count || 0
        }
      })
    )

    return NextResponse.json({
      totalStudents: totalStudents || 0,
      globalPresenceRate,
      statsByFormation,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error("CM Overview Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

