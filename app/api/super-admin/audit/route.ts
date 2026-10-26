import { createClient } from "@/lib/supabase-server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") // Format: "YYYY-MM"
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : null

    let query = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split("-").map(Number)
      const startDate = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0)).toISOString()
      const endDate = new Date(Date.UTC(year, m, 1, 0, 0, 0)).toISOString()
      query = query.gte("created_at", startDate).lt("created_at", endDate)
    }

    if (limit && limit > 0) {
      query = query.limit(limit)
    } else if (!month) {
      // Default to 150 most recent logs when no month filter is given
      query = query.limit(150)
    }

    const { data: logs, error } = await query

    if (error) throw error

    // Format logs to extract actor_name and message from JSON details
    const formattedLogs = (logs || []).map(log => ({
      ...log,
      actor_name: log.details?.actor_name || "Système",
      message: log.details?.message || (typeof log.details === 'string' ? log.details : "Action effectuée")
    }))

    return NextResponse.json(formattedLogs)
  } catch (error) {
    console.error("Audit GET Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
