export type ClassId = "morning" | "afternoon"

export interface Organization {
  id: string
  name: string
  createdAt: string
}

export interface Campus {
  id: string
  orgId: string
  name: string
  createdAt: string
}

export interface Cohort {
  id: string
  campusId: string
  name: string
  startDate?: string
  endDate?: string
  createdAt: string
  campuses?: { name: string }
}

export interface Session {
  id: string
  cohortId: string
  teacherId: string
  date: string
  startTime?: string
  endTime?: string
  title?: string
  createdAt: string
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  email?: string
  cohortId?: string // New hierarchical link
  classId: ClassId // Legacy - mapped to cohort context
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  sessionId: string // New central link
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  present: boolean // Logical derived from status
  classId?: ClassId // Legacy compatibility
}

export interface ClassInfo {
  id: ClassId
  label: string
  start: string
  end: string
}

export interface DailyClassStats {
  date: string
  presentCount: number
  totalCount: number
  rate: number
}

export interface StudentStats {
  student: Student
  daysPresent: number
  daysAbsent: number
  totalDays: number
  presenceRate: number
  absenteeismRate: number
}

export interface UserMembership {
  role: 'super_admin' | 'campus_manager' | 'coach' | 'student'
  org_id: string
  campus_id?: string
  organizations?: { name: string }
  campuses?: { name: string }
}
