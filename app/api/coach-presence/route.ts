import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function GET(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("orga_name, role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== 'campus_manager' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0]

    // Fetch all coaches in the same organization
    const { data: coaches } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("orga_name", profile.orga_name)
      .eq("role", "coach")

    // Fetch attendance for these coaches on this date
    const { data: attendance } = await supabase
      .from("coach_attendance")
      .select("*")
      .eq("orga_name", profile.orga_name)
      .eq("date", date)

    const coachList = (coaches || []).map(coach => ({
      ...coach,
      status: attendance?.find(a => a.coach_id === coach.id)?.status || 'absent'
    }))

    return NextResponse.json(coachList)
  } catch (error) {
    console.error("Coach Presence GET Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("orga_name, role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== 'campus_manager' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { coach_id, date, status } = await req.json()

    // Delete existing
    await supabase
      .from("coach_attendance")
      .delete()
      .eq("coach_id", coach_id)
      .eq("date", date)

    // Insert new
    const { data, error } = await supabase
      .from("coach_attendance")
      .insert({
        coach_id,
        date,
        status,
        marked_by: user.id,
        orga_name: profile.orga_name
      })
      .select()
      .single()

    if (error) throw error

    // Log action
    await logAudit(user.id, 'COACH_ATTENDANCE', `Pointage du formateur (ID: ${coach_id}) : ${status}`, 'coach_attendance', data.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Coach Presence POST Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
