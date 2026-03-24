import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function GET(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get user's campuses from memberships
    const { data: memberships } = await supabase
      .from("memberships")
      .select("campus_id")
      .eq("user_id", user.id)

    const campusIds = (memberships || []).map(m => m.campus_id).filter(id => !!id)

    let query = supabase
      .from("sessions")
      .select(`
        *,
        cohorts (
          id,
          name,
          campuses (id, name)
        )
      `)
      .order("date", { ascending: false })

    // If not super admin (who has no campus restriction in this simplified policy for now)
    // In a real app, we'd filter by campusIds
    if (campusIds.length > 0) {
      query = query.in("cohort_id", (
        await supabase.from("cohorts").select("id").in("campus_id", campusIds)
      ).data?.map(c => c.id) || [])
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET sessions error:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { cohortId, date, title, startTime, endTime } = await req.json()

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        cohort_id: cohortId,
        teacher_id: user.id,
        date: date || new Date().toISOString().split('T')[0],
        title,
        start_time: startTime,
        end_time: endTime
      })
      .select()
      .single()

    if (error) throw error

    await logAudit(user.id, 'CREATE_SESSION', `Création d'une session: ${title || 'Sans titre'} pour le ${date}`, 'session', data.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error("POST session error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
