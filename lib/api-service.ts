import type { Student, AttendanceRecord, ClassId, Cohort, Session, UserMembership } from "./types"

export async function fetchStudents(cohortId?: string): Promise<Student[]> {
  const url = cohortId ? `/api/students?cohortId=${cohortId}` : "/api/students"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch students")
  return res.json()
}

export async function fetchRecords(date?: string, classId?: string, sessionId?: string, cohortId?: string): Promise<AttendanceRecord[]> {
  let url = "/api/records"
  const params = new URLSearchParams()
  if (date) params.append("date", date)
  if (classId) params.append("classId", classId)
  if (sessionId) params.append("sessionId", sessionId)
  if (cohortId) params.append("cohortId", cohortId)
  
  if (params.toString()) url += `?${params.toString()}`
  
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch records")
  return res.json()
}

export async function addStudent(firstName: string, lastName: string, classId: ClassId, email?: string, cohortId?: string): Promise<Student> {
  const res = await fetch("/api/students", { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, classId, email, cohortId }),
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

export async function fetchCohorts(): Promise<Cohort[]> {
  const res = await fetch("/api/cohorts") 
  // Note: I'll need to create this API or update students/formations to return cohorts
  // For now, let's assume it exists or we use a fallback
  if (!res.ok) return [] 
  return res.json()
}

export async function fetchSessions(date?: string): Promise<Session[]> {
  const url = date ? `/api/sessions?date=${date}` : "/api/sessions"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch sessions")
  const data = await res.json()
  return (data || []).map((s: any) => ({
    id: s.id,
    cohortId: s.cohort_id,
    teacherId: s.teacher_id,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    title: s.title,
    createdAt: s.created_at
  }))
}

export async function createSession(data: { cohortId: string, date: string, title: string, startTime?: string, endTime?: string }): Promise<Session> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create session")
  return res.json()
}

export async function saveAttendance(
  date: string, 
  classId: string,
  presentStudentsData: { studentId: string, status?: string }[],
  sessionId?: string
): Promise<void> {
  const res = await fetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, classId, presentStudentsData, sessionId }),
  })
  if (!res.ok) throw new Error("Failed to save attendance")
}

export async function apiBulkAddStudents(students: { firstName: string; lastName: string; classId: ClassId; cohortId?: string }[]): Promise<{ addedCount: number }> {
  // Option 1: Loop over addStudent (simpler for now)
  let addedCount = 0
  for (const s of students) {
    try {
      await addStudent(s.firstName, s.lastName, s.classId, undefined, s.cohortId)
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
export async function fetchProfile(): Promise<{ 
  id: string, 
  role: string, 
  full_name: string, 
  email?: string,
  formation?: string,
  orga_name?: string,
  logo_url?: string,
  formation_label?: string,
  memberships?: UserMembership[]
}> {
  const res = await fetch("/api/profile")
  if (!res.ok) throw new Error("Failed to fetch profile")
  return res.json()
}

export async function updateProfile(data: { 
  full_name?: string, 
  formation?: string, 
  orga_name?: string,
  logo_url?: string
}): Promise<any> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update profile")
  return res.json()
}

export async function fetchCampuses() {
  const res = await fetch("/api/campuses")
  if (!res.ok) throw new Error("Failed to fetch campuses")
  return res.json()
}

export async function createCampus(name: string) {
  const res = await fetch("/api/campuses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error("Failed to create campus")
  return res.json()
}


export async function deleteCampus(id: string) {
  const res = await fetch(`/api/campuses?id=${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete campus")
  return res.json()
}

export async function createCohort(data: { name: string; campusId: string; startDate?: string; endDate?: string }) {
  const res = await fetch("/api/cohorts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create cohort")
  return res.json()
}

export async function fetchCohortDetail(id: string) {
  const res = await fetch(`/api/cohorts/${id}`)
  if (!res.ok) throw new Error("Failed to fetch cohort detail")
  return res.json()
}

export async function updateCohort(id: string, updates: { name?: string; campusId?: string; startDate?: string; endDate?: string }) {
  const res = await fetch(`/api/cohorts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error("Failed to update cohort")
  return res.json()
}

export async function deleteCohort(id: string, cascade: boolean = false) {
  const res = await fetch(`/api/cohorts/${id}?cascade=${cascade}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete cohort")
  return res.json()
}

export async function fetchCohortStats(id: string) {
  const res = await fetch(`/api/cohorts/${id}/stats`)
  if (!res.ok) throw new Error("Failed to fetch cohort stats")
  return res.json()
}
