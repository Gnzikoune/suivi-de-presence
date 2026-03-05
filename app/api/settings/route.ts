import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function GET() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", user.id)

    if (error) throw error

    const settings: Record<string, string> = {}
    ;(data || []).forEach(r => {
      if (r.key && r.value) {
        settings[r.key] = r.value
      }
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Fetch settings error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { key, value, description } = body

    const { data, error } = await supabase
      .from("settings")
      .upsert({ 
        key, 
        value, 
        description,
        user_id: user.id 
      }, { onConflict: 'user_id,key' })
      .select()

    if (error) throw error

    // Log action
    await logAudit(user.id, 'SAVE_SETTING', `Modification du paramètre: ${key} -> ${value}`, 'settings', key)

    return NextResponse.json({ success: true, updated: true })
  } catch (error) {
    console.error("Save settings error:", error)
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 })
  }
}
