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
      .select("role, campus_id, cohort_id")
      .eq("id", user.id)
      .single()

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get("role")

    let query = supabase
      .from("announcements")
      .select("*, campuses:campus_id(name), cohorts:cohort_id(name)")
      .order("created_at", { ascending: false })

    // For regular users (coach/student), only show relevant announcements
    if (profile?.role !== 'super_admin' && profile?.role !== 'campus_manager') {
      // announcements for 'all' roles OR their specific role
      query = query.or(`target_role.eq.all,target_role.eq.${profile?.role}`)
      
      // Filter by campus (null or matches user)
      if (profile?.campus_id) {
        query = query.or(`campus_id.is.null,campus_id.eq.${profile.campus_id}`)
      } else {
        query = query.is("campus_id", null)
      }
      
      // Filter by cohort (null or matches user)
      if (profile?.cohort_id) {
        query = query.or(`cohort_id.is.null,cohort_id.eq.${profile.cohort_id}`)
      } else {
        query = query.is("cohort_id", null)
      }
    } else if (roleFilter && roleFilter !== 'all') {
      query = query.eq("target_role", roleFilter)
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data)
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

    const { title, message, target_role, campus_id, cohort_id } = await req.json()
    if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 })

    // Fetch profile for role check and author_name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single()

    if (!profile || !['super_admin', 'campus_manager'].includes(profile.role)) {
      return NextResponse.json({ error: "Interdit : Seuls les administrateurs peuvent publier" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        author_id: user.id,
        author_name: profile?.full_name || "Admin",
        title,
        message,
        target_role: target_role || 'all',
        campus_id: (campus_id && campus_id !== 'all') ? campus_id : null,
        cohort_id: (cohort_id && cohort_id !== 'all') ? cohort_id : null
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

    // Fetch title for audit before deletion
    const { data: announcement } = await supabase
      .from("announcements")
      .select("*, campuses:campus_id(name), cohorts:cohort_id(name)")
      .eq("id", id)
      .single()

    const { error } = await supabase
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
