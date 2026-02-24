import { NextResponse } from "next/server"
import { attendanceTable, studentsTable } from "@/lib/airtable"
import type { AttendanceRecord } from "@/lib/types"

export async function GET() {
  try {
    const records = await attendanceTable.select().all()
    const attendanceRecords: AttendanceRecord[] = records.map((record) => ({
      id: record.id,
      studentId: (record.get("studentId") as string[])?.[0] || "",
      date: record.get("date") as string,
      classId: record.get("classId") as any,
      present: !!record.get("present"),
      arrivalTime: record.get("arrivalTime") as string || undefined,
    }))
    return NextResponse.json(attendanceRecords)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, classId, presentStudentsData } = body as { 
      date: string; 
      classId: string; 
      presentStudentsData: { studentId: string, arrivalTime: string }[] 
    }

    const presentIds = presentStudentsData.map(p => p.studentId)

    // 1. Get all students of this class
    const allStudents = await studentsTable.select({
      filterByFormula: `{classId} = '${classId}'`
    }).all()

    // 2. Delete existing records for this date and class
    const existingRecords = await attendanceTable.select({
      filterByFormula: `AND({date} = '${date}', {classId} = '${classId}')`
    }).all()

    if (existingRecords.length > 0) {
      // Chunk deletion (Airtable supports up to 10 at once)
      const idsToDelete = existingRecords.map(r => r.id)
      for (let i = 0; i < idsToDelete.length; i += 10) {
        await Promise.all(idsToDelete.slice(i, i + 10).map(id => attendanceTable.destroy(id)))
      }
    }

    // 3. Create new records for ALL students (mark presence and absence)
    const recordsToCreate = allStudents.map(student => {
      const presenceInfo = presentStudentsData.find(p => p.studentId === student.id)
      const isPresent = !!presenceInfo
      
      return {
        fields: {
          studentId: [student.id],
          date,
          classId,
          present: isPresent,
          ...(isPresent && presenceInfo?.arrivalTime ? { arrivalTime: presenceInfo.arrivalTime } : {})
        }
      }
    })

    const chunks = []
    for (let i = 0; i < recordsToCreate.length; i += 10) {
      chunks.push(recordsToCreate.slice(i, i + 10))
    }

    await Promise.all(chunks.map(chunk => attendanceTable.create(chunk)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Airtable Error:", error)
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 })
  }
}
