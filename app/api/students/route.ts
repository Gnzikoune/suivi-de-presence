import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import type { Student } from "@/lib/types"
import { logAudit } from "@/lib/audit-service"

export async function GET() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const students: Student[] = (data || []).map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      classId: s.class_id,
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
    const { firstName, lastName, classId } = body

    const { data, error } = await supabase
      .from("students")
      .insert({
        first_name: firstName,
        last_name: lastName,
        class_id: classId,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    const newStudent: Student = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      classId: data.class_id,
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

    const body = await req.json()
    const { id, ...updates } = body

    const supabaseUpdates: any = {}
    if (updates.firstName) supabaseUpdates.first_name = updates.firstName
    if (updates.lastName) supabaseUpdates.last_name = updates.lastName
    if (updates.classId) supabaseUpdates.class_id = updates.classId

    const { data, error } = await supabase
      .from("students")
      .update(supabaseUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    const updatedStudent: Student = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      classId: data.class_id,
      createdAt: data.created_at,
    }

    // Log action
    await logAudit(user.id, 'UPDATE_STUDENT', `Modification de l'apprenant: ${data.first_name} ${data.last_name}`, 'student', data.id)

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

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    // Optional: Fetch name for logging before deletion
    const { data: student } = await supabase.from("students").select("first_name, last_name").eq("id", id).single()

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error

    // Log action
    await logAudit(user.id, 'DELETE_STUDENT', `Suppression de l'apprenant: ${student?.first_name} ${student?.last_name}`, 'student', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Supabase Error (DELETE students):", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}
