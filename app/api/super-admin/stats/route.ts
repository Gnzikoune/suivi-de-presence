import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Verify super_admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 1. Total students
    const { count: totalStudents } = await supabase
      .from("students")
      .select("*", { count: 'exact', head: true })

    // 2. Average Presence Rate
    const { data: recordsData } = await supabase
      .from("records")
      .select("present")

    const totalRecords = recordsData?.length || 0
    const presentRecords = recordsData?.filter(r => r.present).length || 0
    const globalPresenceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

    // 3. User distribution
    const { data: users } = await supabase
      .from("profiles")
      .select("role, formation")

    const rolesCount = {
      coach: users?.filter(u => u.role === 'coach' || (u.role === 'super_admin' && u.formation)).length || 0,
      campus_manager: users?.filter(u => u.role === 'campus_manager').length || 0,
      super_admin: users?.filter(u => u.role === 'super_admin').length || 0,
    }

    return NextResponse.json({
      totalStudents: totalStudents || 0,
      globalPresenceRate,
      rolesCount,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error("Super Admin Stats Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
