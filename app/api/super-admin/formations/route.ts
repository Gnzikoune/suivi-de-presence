import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function GET() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from("formations")
      .select("*")
      .order("label", { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch formations" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check role using regular client (RLS should allow reading own profile or profile info)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { label, value } = await req.json()
    
    // Use Admin Client to bypass RLS for insertion
    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from("formations")
      .insert({ label, value })
      .select()
      .single()

    if (error) {
      console.error("Formation creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log action
    await logAudit(user.id, 'CREATE_FORMATION', `Création de la formation: ${label} (${value})`, 'formation', data.id)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Failed to create formation:", error)
    return NextResponse.json({ error: error.message || "Failed to create formation" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check permissions
    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (adminProfile?.role !== 'super_admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Use Admin Client for deletion
    const adminClient = await createAdminClient()
    
    // Optional: Fetch name for logging before deletion
    const { data: formation } = await adminClient.from("formations").select("label").eq("id", id).single()

    const { error } = await adminClient.from("formations").delete().eq("id", id)
    if (error) {
      console.error("Formation deletion error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log action
    await logAudit(user.id, 'DELETE_FORMATION', `Suppression de la formation: ${formation?.label || id}`, 'formation', id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to delete formation:", error)
    return NextResponse.json({ error: error.message || "Failed to delete formation" }, { status: 500 })
  }
}
