import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

// GET: List all announcements
export async function GET(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const { searchParams } = new URL(req.url)
    const targetRole = searchParams.get("role")

    let query = supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })

    if (targetRole && targetRole !== 'all') {
      query = query.eq("target_role", targetRole)
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("Announcements GET Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST: Create a new announcement
export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only Super Admin can post announcements
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, message, target_role } = await req.json()
    if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 })

    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from("announcements")
      .insert({
        author_id: user.id,
        author_name: profile.full_name || "Admin",
        title,
        message,
        target_role: target_role || 'all'
      })
      .select()
      .single()

    if (error) throw error

    // Log action
    await logAudit(user.id, 'CREATE_ANNOUNCEMENT', `Publication d'une annonce: ${title}`, 'announcement', data.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Announcements POST Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE: Delete an announcement
export async function DELETE(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const adminClient = await createAdminClient()
    
    // Fetch title for audit before deletion
    const { data: announcement } = await adminClient
      .from("announcements")
      .select("title")
      .eq("id", id)
      .single()

    const { error } = await adminClient
      .from("announcements")
      .delete()
      .eq("id", id)

    if (error) throw error

    // Log action
    await logAudit(user.id, 'DELETE_ANNOUNCEMENT', `Suppression de l'annonce: ${announcement?.title || id}`, 'announcement', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Announcements DELETE Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
