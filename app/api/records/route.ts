import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { AttendanceRecord } from "@/lib/types"
import { logAudit } from "@/lib/audit-service"

export async function GET() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("records")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (error) throw error

    const attendanceRecords: AttendanceRecord[] = (data || []).map((r) => ({
      id: r.id,
      studentId: r.student_id,
      date: r.date,
      classId: r.class_id,
      present: !!r.present,
    }))
    return NextResponse.json(attendanceRecords)
  } catch (error) {
    console.error("Supabase Error (GET records):", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { date, classId, presentStudentsData } = await req.json() as { 
      date: string, 
      classId: string, 
      presentStudentsData: { studentId: string }[] 
    }

    // 1. Delete existing for this date/class
    const { error: deleteError } = await supabase
      .from("records")
      .delete()
      .eq("user_id", user.id)
      .eq("date", date)
      .eq("class_id", classId)

    if (deleteError) throw deleteError

    // 2. Fetch students to mark all
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .eq("class_id", classId)

    if (studentsError) throw studentsError
    if (!students) return NextResponse.json({ success: true })

    const recordsToInsert = students.map(s => {
      const isPresent = presentStudentsData.some(p => p.studentId === s.id)
      return {
        user_id: user.id,
        student_id: s.id,
        date,
        class_id: classId,
        present: isPresent,
      }
    })

    if (recordsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("records")
        .insert(recordsToInsert)

      if (insertError) throw insertError
    }

    // Log action
    await logAudit(
      user.id, 
      'SAVE_ATTENDANCE', 
      `Pointage du ${date} (${classId === 'morning' ? 'Matin' : 'Après-midi'}) effectué avec ${presentStudentsData.length} présents`,
      'attendance',
      `${date}_${classId}`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Supabase Error (POST records):", error)
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 })
  }
}
