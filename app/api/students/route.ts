import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { Student } from "@/lib/types"
import { logAudit } from "@/lib/audit-service"

export async function GET(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const cohortId = searchParams.get("cohortId")

    // 1. Get user role from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, orga_name")
      .eq("id", user.id)
      .single()

    const isGlobalAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'

    // 2. Organization and query building
    const { data: membership } = await supabase
      .from("memberships")
      .select(`
        organizations (id, name)
      `)
      .eq("user_id", user.id)
      .single()

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("orga_name")
      .eq("id", user.id)
      .single()

    const orgaName = (membership as any)?.organizations?.name || userProfile?.orga_name
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    let queryData: any[] = []

    if (isGlobalAdmin && !orgaName) {
      // Global admin with no specific orga: see everything
      const adminSupabase = await createAdminClient()
      let query = adminSupabase.from("students").select("*")
      if (cohortId && uuidRegex.test(cohortId)) {
        query = query.eq("cohort_id", cohortId)
      }
      const { data, error } = await query
        .order("lastName", { ascending: true })
        .order("firstName", { ascending: true })
      if (error) throw error
      queryData = data || []
    } else {
      // Regular user or admin restricted to an orga
      // Note: If orgaName is missing even after checking both sources, we'll try to find one or return empty
      if (!orgaName) return NextResponse.json([])
      
      let query = supabase.from("students").select("*").eq("orga_name", orgaName)
      if (cohortId && uuidRegex.test(cohortId)) {
        query = query.eq("cohort_id", cohortId)
      }
      
      const { data, error } = await query
        .order("lastName", { ascending: true })
        .order("firstName", { ascending: true })
      if (error) throw error
      queryData = data || []
    }

    const students: Student[] = (queryData || []).map((s: any) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      cohortId: s.cohort_id,
      classId: s.classId || 'morning',
      createdAt: s.created_at,
    }))
    return NextResponse.json(students)
  } catch (error) {
    console.error("Supabase Error (GET students):", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { firstName, lastName, classId, email, cohortId } = body

    // 1. Get organization context (Membership)
    const { data: membership, error: memError } = await supabase
      .from("memberships")
      .select(`
        organizations (name)
      `)
      .eq("user_id", user.id)
      .single()

    // 2. Fallback to profile orga_name if membership is missing (Super Admin/Global)
    let finalOrgaName = (membership as any)?.organizations?.name
    if (!finalOrgaName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("orga_name")
        .eq("id", user.id)
        .single()
      finalOrgaName = profile?.orga_name
    }

    // 3. Prevent Duplicates: Check if a student with same name/cohort/orga already exists
    const adminSupabase = await createAdminClient()
    const { data: existingStudent } = await adminSupabase
      .from("students")
      .select("id")
      .eq("firstName", firstName)
      .eq("lastName", lastName)
      .eq("cohort_id", cohortId)
      .eq("orga_name", finalOrgaName)
      .maybeSingle()

    if (existingStudent) {
      return NextResponse.json({ error: "Cet apprenant existe déjà dans cette cohorte." }, { status: 409 })
    }

    // 4. Insert student record using Admin Client for robustness
    const { data, error } = await adminSupabase
      .from("students")
      .insert({
        firstName: firstName,
        lastName: lastName,
        classId: classId || 'morning',
        cohort_id: cohortId,
        email: email || null,
        user_id: user.id,
        orga_name: finalOrgaName
      })
      .select()
      .single()

    if (error) {
      console.error("POST student insertion error:", error)
      throw error
    }

    // 4. Whitelist student email in 'profiles' so they can Sign Up
    if (email) {
      await adminSupabase
        .from("profiles")
        .upsert({
          email: email,
          full_name: `${firstName} ${lastName}`.trim(),
          role: 'student',
          orga_name: finalOrgaName,
          formation: cohortId // Store cohort ID as formation for students
        }, { onConflict: 'email' })
    }

    const newStudent: Student = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      classId: data.classId,
      cohortId: data.cohortId,
      createdAt: data.created_at,
    }

    // Log action
    await logAudit(user.id, 'CREATE_STUDENT', `Ajout de l'apprenant: ${firstName} ${lastName}`, 'student', data.id)

    return NextResponse.json(newStudent)
  } catch (error) {
    console.error("Supabase Error (POST students):", error)
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Get role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    const isGlobalAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'

    // 2. Get membership/orga for non-global admin
    const { data: membership } = await supabase
      .from("memberships")
      .select(`
        organizations (name)
      `)
      .eq("user_id", user.id)
      .single()
    const orgaName = (membership as any)?.organizations?.name

    const body = await req.json()
    const { id, ...updates } = body
    const { firstName, lastName, classId, cohortId } = updates

    const supabaseUpdates: any = {}
    if (firstName) supabaseUpdates.firstName = firstName
    if (lastName) supabaseUpdates.lastName = lastName
    if (classId) supabaseUpdates.classId = classId
    if (cohortId) supabaseUpdates.cohort_id = cohortId

    let query = null
    if (isGlobalAdmin) {
      const adminSupabase = await createAdminClient()
      query = adminSupabase.from("students").update(supabaseUpdates).eq("id", id)
    } else {
      if (!orgaName) return NextResponse.json({ error: "No organization associated" }, { status: 403 })
      query = supabase.from("students").update(supabaseUpdates).eq("id", id).eq("orga_name", orgaName)
    }

    const { data, error } = await query.select().single()

    if (error) throw error

    const updatedStudent: Student = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      classId: data.classId,
      cohortId: data.cohort_id,
      createdAt: data.created_at,
    }

    // Log action
    await logAudit(user.id, 'UPDATE_STUDENT', `Modification de l'apprenant: ${data.firstName} ${data.lastName}`, 'student', data.id)

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error("Supabase Error (PATCH students):", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Get role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    const isGlobalAdmin = profile?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'

    // 2. Get membership for non-global admin
    const { data: membership } = await supabase
      .from("memberships")
      .select("organizations(name)")
      .eq("user_id", user.id)
      .single()
    const orgaName = (membership as any)?.organizations?.name

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    // 3. Setup client and fetch student for logging
    const adminSupabase = await createAdminClient()
    const client = isGlobalAdmin ? adminSupabase : supabase

    const { data: student } = await client
      .from("students")
      .select("firstName, lastName")
      .eq("id", id)
      .single()

    // 4. Perform deletion
    let query = client.from("students").delete().eq("id", id)
    if (!isGlobalAdmin) {
      if (!orgaName) return NextResponse.json({ error: "No organization associated" }, { status: 403 })
      query = query.eq("orga_name", orgaName)
    }

    const { error } = await query

    if (error) throw error

    // Log action
    await logAudit(user.id, 'DELETE_STUDENT', `Suppression de l'apprenant: ${student?.firstName} ${student?.lastName}`, 'student', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Supabase Error (DELETE students):", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}
