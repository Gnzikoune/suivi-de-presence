import {
  eachDayOfInterval,
  isWeekend,
  parseISO,
  format,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns"
import type {
  Student,
  AttendanceRecord,
  ClassId,
  DailyClassStats,
  StudentStats,
} from "./types"
import { FORMATION_START, FORMATION_END } from "./constants"

/**
 * Get all business days (Mon-Fri) between two dates
 */
export function getBusinessDays(
  start: string,
  end: string
): Date[] {
  const startDate = parseISO(start)
  const endDate = parseISO(end)
  if (isAfter(startDate, endDate)) return []
  return eachDayOfInterval({ start: startDate, end: endDate }).filter(
    (d) => !isWeekend(d)
  )
}

/**
 * Get business days elapsed so far
 */
export function getElapsedBusinessDays(
  formationStart: string = FORMATION_START,
  formationEnd: string = FORMATION_END
): Date[] {
  const today = startOfDay(new Date())
  const formEnd = parseISO(formationEnd)
  const effectiveEnd = isBefore(today, formEnd) ? today : formEnd
  return getBusinessDays(formationStart, format(effectiveEnd, "yyyy-MM-dd"))
}

/**
 * Get total formation business days
 */
export function getTotalBusinessDays(
  formationStart: string = FORMATION_START,
  formationEnd: string = FORMATION_END
): number {
  return getBusinessDays(formationStart, formationEnd).length
}

/**
 * Calculate individual student stats
 */
export function getStudentStats(
  student: Student,
  records: AttendanceRecord[],
  formationStart: string = FORMATION_START,
  formationEnd: string = FORMATION_END
): StudentStats {
  const studentRecords = records.filter((r) => r.studentId === student.id)
  const elapsedDays = getElapsedBusinessDays(formationStart, formationEnd).length
  const daysPresent = studentRecords.filter((r) => r.present).length
  const daysAbsent = studentRecords.filter((r) => !r.present).length
  const totalRecordedDays = studentRecords.length
  const unrecordedDays = Math.max(0, elapsedDays - totalRecordedDays)
  const totalAbsent = daysAbsent + unrecordedDays

  const presenceRate = elapsedDays > 0 ? (daysPresent / elapsedDays) * 100 : 0
  const absenteeismRate = elapsedDays > 0 ? (totalAbsent / elapsedDays) * 100 : 0

  return {
    student,
    daysPresent,
    daysAbsent: totalAbsent,
    totalDays: elapsedDays,
    presenceRate: Math.round(presenceRate * 10) / 10,
    absenteeismRate: Math.round(absenteeismRate * 10) / 10,
  }
}

/**
 * Calculate class stats for all students in a class
 */
export function getClassStats(
  students: Student[],
  records: AttendanceRecord[],
  classId: ClassId,
  formationStart: string = FORMATION_START,
  formationEnd: string = FORMATION_END
): {
  averagePresenceRate: number
  averageAbsenteeismRate: number
  studentStats: StudentStats[]
  dailyStats: DailyClassStats[]
} {
  const classStudents = students.filter((s) => s.classId === classId)
  const classRecords = records.filter((r) => r.classId === classId)

  const studentStats = classStudents.map((s) => 
    getStudentStats(s, classRecords, formationStart, formationEnd)
  )

  const averagePresenceRate =
    studentStats.length > 0
      ? Math.round(
          (studentStats.reduce((sum, s) => sum + s.presenceRate, 0) /
            studentStats.length) *
            10
        ) / 10
      : 0

  const averageAbsenteeismRate =
    studentStats.length > 0
      ? Math.round(
          (studentStats.reduce((sum, s) => sum + s.absenteeismRate, 0) /
            studentStats.length) *
            10
        ) / 10
      : 0

  const elapsedDays = getElapsedBusinessDays(formationStart, formationEnd)
  const dailyStats: DailyClassStats[] = elapsedDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const dayRecords = classRecords.filter((r) => r.date === dateStr)
    const presentCount = dayRecords.filter((r) => r.present).length
    const totalCount = classStudents.length
    return {
      date: dateStr,
      presentCount,
      totalCount,
      rate: totalCount > 0 ? Math.round((presentCount / totalCount) * 1000) / 10 : 0,
    }
  })

  return { averagePresenceRate, averageAbsenteeismRate, studentStats, dailyStats }
}

/**
 * Calculate global stats across both classes
 */
export function getGlobalStats(
  students: Student[],
  records: AttendanceRecord[],
  formationStart: string = FORMATION_START,
  formationEnd: string = FORMATION_END
): {
  totalStudents: number
  morningStudents: number
  afternoonStudents: number
  morningStats: ReturnType<typeof getClassStats>
  afternoonStats: ReturnType<typeof getClassStats>
  globalPresenceRate: number
  globalAbsenteeismRate: number
  elapsedDays: number
  totalDays: number
} {
  const morningStats = getClassStats(students, records, "morning", formationStart, formationEnd)
  const afternoonStats = getClassStats(students, records, "afternoon", formationStart, formationEnd)

  const morningStudents = students.filter((s) => s.classId === "morning").length
  const afternoonStudents = students.filter((s) => s.classId === "afternoon").length
  const totalStudents = students.length

  const globalPresenceRate =
    totalStudents > 0
      ? Math.round(
          ((morningStats.averagePresenceRate * morningStudents +
            afternoonStats.averagePresenceRate * afternoonStudents) /
            totalStudents) *
            10
        ) / 10
      : 0

  const globalAbsenteeismRate =
    totalStudents > 0
      ? Math.round(
          ((morningStats.averageAbsenteeismRate * morningStudents +
            afternoonStats.averageAbsenteeismRate * afternoonStudents) /
            totalStudents) *
            10
        ) / 10
      : 0

  return {
    totalStudents,
    morningStudents,
    afternoonStudents,
    morningStats,
    afternoonStats,
    globalPresenceRate,
    globalAbsenteeismRate,
    elapsedDays: getElapsedBusinessDays(formationStart, formationEnd).length,
    totalDays: getTotalBusinessDays(formationStart, formationEnd),
  }
}

/**
 * Get today's attendance summary for a class
 */
export function getTodayClassSummary(
  students: Student[],
  records: AttendanceRecord[],
  classId: ClassId
): { present: number; total: number; rate: number } {
  const today = format(new Date(), "yyyy-MM-dd")
  const classStudents = students.filter((s) => s.classId === classId)
  const todayRecords = records.filter(
    (r) => r.date === today && r.classId === classId
  )
  const present = todayRecords.filter((r) => r.present).length
  const total = classStudents.length
  return {
    present,
    total,
    rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
  }
}
/**
 * Calculate trend stats (Current Week vs Last Week)
 */
export function getTrendStats(
  students: Student[],
  records: AttendanceRecord[]
): {
  attendanceTrend: { value: string; direction: 'up' | 'down' | 'neutral' }
  absenteeismTrend: { value: string; direction: 'up' | 'down' | 'neutral' }
} {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 (Sun) to 6 (Sat)
  
  // Current week range (Monday to today)
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  currentWeekStart.setHours(0, 0, 0, 0)
  
  // Previous week range (Last Monday to Last Friday/Sunday)
  const lastWeekStart = new Date(currentWeekStart)
  lastWeekStart.setDate(currentWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(currentWeekStart)
  lastWeekEnd.setDate(currentWeekStart.getDate() - 1)
  lastWeekEnd.setHours(23, 59, 59, 999)

  const getWeekRate = (start: Date, end: Date) => {
    const weekRecords = records.filter(r => {
      const d = new Date(r.date)
      return d >= start && d <= end
    })
    if (weekRecords.length === 0) return null
    const present = weekRecords.filter(r => r.present).length
    return (present / weekRecords.length) * 100
  }

  const currentRate = getWeekRate(currentWeekStart, today)
  const lastRate = getWeekRate(lastWeekStart, lastWeekEnd)

  if (currentRate === null || lastRate === null) {
    return {
      attendanceTrend: { value: "0%", direction: "neutral" },
      absenteeismTrend: { value: "0%", direction: "neutral" }
    }
  }

  const diff = currentRate - lastRate
  const absDiff = Math.abs(Math.round(diff * 10) / 10)
  
  return {
    attendanceTrend: {
      value: `${absDiff}%`,
      direction: diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : 'neutral'
    },
    absenteeismTrend: {
      value: `${absDiff}%`,
      direction: diff > 0.1 ? 'down' : diff < -0.1 ? 'up' : 'neutral' // Inverse for absenteeism
    }
  }
}
