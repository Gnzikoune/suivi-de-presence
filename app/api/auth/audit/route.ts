import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { event } = await req.json()
    if (!event || !['LOGIN', 'LOGOUT'].includes(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    }

    await logAudit(
      user.id, 
      event, 
      event === 'LOGIN' ? "Connexion à la plateforme" : "Déconnexion de la plateforme"
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Auth Audit Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
