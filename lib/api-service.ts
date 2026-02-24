import type { Student, AttendanceRecord, ClassId } from "./types"

export async function fetchStudents(): Promise<Student[]> {
  const res = await fetch("/api/students")
  if (!res.ok) throw new Error("Failed to fetch students")
  return res.json()
}

export async function fetchRecords(): Promise<AttendanceRecord[]> {
  const res = await fetch("/api/records")
  if (!res.ok) throw new Error("Failed to fetch records")
  return res.json()
}

export async function addStudent(firstName: string, lastName: string, classId: ClassId): Promise<Student> {
  const res = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, classId }),
  })
  if (!res.ok) throw new Error("Failed to add student")
  return res.json()
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  const res = await fetch("/api/students", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) throw new Error("Failed to update student")
  return res.json()
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`/api/students?id=${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete student")
}

export async function saveAttendance(
  date: string, 
  classId: ClassId, 
  presentStudentsData: { studentId: string, arrivalTime: string }[]
): Promise<void> {
  const res = await fetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, classId, presentStudentsData }),
  })
  if (!res.ok) throw new Error("Failed to save attendance")
}

export async function apiBulkAddStudents(students: { firstName: string; lastName: string; classId: ClassId }[]): Promise<{ addedCount: number }> {
  // Option 1: Loop over addStudent (simpler for now)
  let addedCount = 0
  for (const s of students) {
    try {
      await addStudent(s.firstName, s.lastName, s.classId)
      addedCount++
    } catch (error) {
      console.error("Failed to add student during bulk", s, error)
    }
  }
  return { addedCount }
}

export async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error("Failed to fetch settings")
  return res.json()
}

export async function saveSetting(key: string, value: string, description?: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, description })
  })
  if (!res.ok) throw new Error("Failed to save setting")
  return res.json()
}
