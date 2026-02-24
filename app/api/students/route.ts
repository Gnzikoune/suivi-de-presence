import { NextResponse } from "next/server"
import { studentsTable } from "@/lib/airtable"
import type { Student } from "@/lib/types"

export async function GET() {
  try {
    const records = await studentsTable.select().all()
    const students: Student[] = records.map((record) => ({
      id: record.id,
      firstName: record.get("firstName") as string,
      lastName: record.get("lastName") as string,
      classId: record.get("classId") as any,
      createdAt: record.get("createdAt") as string,
    }))
    return NextResponse.json(students)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, classId } = body

    const record = await studentsTable.create({
      firstName,
      lastName,
      classId,
      createdAt: new Date().toISOString(),
    })

    const newStudent: Student = {
      id: record.id,
      firstName: record.get("firstName") as string,
      lastName: record.get("lastName") as string,
      classId: record.get("classId") as any,
      createdAt: record.get("createdAt") as string,
    }

    return NextResponse.json(newStudent)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    const record = await studentsTable.update(id, updates)

    const updatedStudent: Student = {
      id: record.id,
      firstName: record.get("firstName") as string,
      lastName: record.get("lastName") as string,
      classId: record.get("classId") as any,
      createdAt: record.get("createdAt") as string,
    }

    return NextResponse.json(updatedStudent)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    await studentsTable.destroy(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}
