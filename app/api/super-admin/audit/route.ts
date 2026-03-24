import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
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

    const { data: logs, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    // Format logs to extract actor_name and message from JSON details
    const formattedLogs = logs.map(log => ({
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
