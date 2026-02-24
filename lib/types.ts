export type ClassId = "morning" | "afternoon"

export interface Student {
  id: string
  firstName: string
  lastName: string
  classId: ClassId
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  classId: ClassId
  present: boolean
  arrivalTime?: string
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
