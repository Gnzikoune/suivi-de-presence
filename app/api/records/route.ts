import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { AttendanceRecord } from "@/lib/types"
import { logAudit } from "@/lib/audit-service"

export async function GET(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const classId = searchParams.get("classId")
    const cohortId = searchParams.get("cohortId")
    const sessionId = searchParams.get("sessionId")

    // 1. Resolve Organization reliably
    const { data: profile } = await supabase.from("profiles").select("orga_name").eq("id", user.id).single()
    const { data: membership } = await supabase.from("memberships").select(`organizations (name)`).eq("user_id", user.id).maybeSingle()
    const orgaName = (membership as any)?.organizations?.name || profile?.orga_name

    let query = supabase.from("records").select("*")

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    } else {
      if (date) query = query.eq("date", date)
      if (classId) query = query.eq("class_id", classId)
    }
    
    if (orgaName) {
      query = query.eq("orga_name", orgaName)
    }

    // Support filtering by cohortId via joining students
    if (cohortId && cohortId !== 'all') {
      const { data: students } = await supabase.from("students").select("id").eq("cohort_id", cohortId)
      const studentIds = students?.map(s => s.id) || []
      if (studentIds.length > 0) {
        query = query.in("student_id", studentIds)
      } else {
        return NextResponse.json([])
      }
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json((data || []).map((r) => ({
      id: r.id,
      studentId: r.student_id,
      date: r.date,
      classId: r.class_id, 
      present: !!r.present,
      sessionId: r.session_id,
      status: r.status
    })))
  } catch (error) {
    console.error("GET records error:", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { date, classId, sessionId, presentStudentsData } = await req.json()
    
    // Resolve Organization
    const { data: profile } = await supabase.from("profiles").select("orga_name").eq("id", user.id).single()
    const { data: membership } = await supabase.from("memberships").select(`organizations (name)`).eq("user_id", user.id).maybeSingle()
    const orgaName = (membership as any)?.organizations?.name || profile?.orga_name

    if (!orgaName) {
       console.error("POST records: No organization found for user", user.id)
       return NextResponse.json({ error: "Organization required" }, { status: 400 })
    }

    // 1. Clear existing records for this context
    if (sessionId) {
      await supabase.from("records").delete().eq("session_id", sessionId).eq("orga_name", orgaName)
    } else {
      await supabase.from("records").delete().eq("date", date).eq("class_id", classId).eq("orga_name", orgaName)
    }

    // 2. Insert new records
    const recordsToInsert = presentStudentsData.map((p: any) => ({
      user_id: user.id,
      orga_name: orgaName,
      student_id: p.studentId,
      date: date,
      class_id: classId,
      session_id: sessionId,
      present: true,
      status: p.status || 'present'
    }))

    if (recordsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("records").insert(recordsToInsert)
      if (insertError) throw insertError
    }

    await logAudit(user.id, 'SAVE_ATTENDANCE', `Pointage: ${presentStudentsData.length} élèves.`, 'attendance', sessionId || `${date}_${classId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST records error:", error)
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 })
  }
}
