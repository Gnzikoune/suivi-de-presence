/**
 * Offline storage utility for local persistence during power cuts / network outages.
 * Provides caching with fallback for students, cohorts, sessions, profiles and attendance.
 */

import type { Student, Cohort, Session, AttendanceRecord } from "./types"

const PREFIX = "suivi_presence_cache_"

export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function isNetworkAvailable(): boolean {
  return isBrowser() ? navigator.onLine : true
}

export function setLocalCache<T>(key: string, data: T): void {
  if (!isBrowser()) return
  try {
    const item = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(PREFIX + key, JSON.stringify(item))
  } catch (error) {
    console.warn(`[OfflineStorage] Failed to save cache for key: ${key}`, error)
  }
}

export function getLocalCache<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed.data ?? fallback
  } catch (error) {
    console.warn(`[OfflineStorage] Failed to read cache for key: ${key}`, error)
    return fallback
  }
}

export function getCacheTimestamp(key: string): number | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.timestamp || null
  } catch {
    return null
  }
}

// -------------------------------------------------------------
// Specific Domain Cache Helpers
// -------------------------------------------------------------

// Students
export function cacheStudents(students: Student[], cohortId?: string): void {
  const key = cohortId ? `students_${cohortId}` : "students_all"
  setLocalCache(key, students)
  if (!cohortId) {
    // Also save in a global bucket if fetching all
    setLocalCache("students_master", students)
  }
}

export function getCachedStudents(cohortId?: string): Student[] {
  const key = cohortId ? `students_${cohortId}` : "students_all"
  let cached = getLocalCache<Student[]>(key, [])
  
  // If specific cohort cache is empty, try filtering from master list
  if (cached.length === 0 && cohortId) {
    const master = getLocalCache<Student[]>("students_master", [])
    if (master.length > 0) {
      cached = master.filter(s => s.cohortId === cohortId)
    }
  }
  
  return cached
}

// Cohorts
export function cacheCohorts(cohorts: Cohort[]): void {
  setLocalCache("cohorts", cohorts)
}

export function getCachedCohorts(): Cohort[] {
  return getLocalCache<Cohort[]>("cohorts", [])
}

// Profile
export function cacheProfile(profile: any): void {
  setLocalCache("profile", profile)
}

export function getCachedProfile(): any | null {
  return getLocalCache<any | null>("profile", null)
}

// Sessions
export function cacheSessions(sessions: Session[], date?: string): void {
  const key = date ? `sessions_${date}` : "sessions_latest"
  setLocalCache(key, sessions)
}

export function getCachedSessions(date?: string): Session[] {
  const key = date ? `sessions_${date}` : "sessions_latest"
  return getLocalCache<Session[]>(key, [])
}

// Records
export function getRecordsCacheKey(date: string, classId?: string, cohortId?: string): string {
  return `records_${date}_${classId || "all"}_${cohortId || "all"}`
}

export function cacheRecords(records: AttendanceRecord[], date: string, classId?: string, cohortId?: string): void {
  const key = getRecordsCacheKey(date, classId, cohortId)
  setLocalCache(key, records)
}

export function getCachedRecords(date: string, classId?: string, cohortId?: string): AttendanceRecord[] {
  const key = getRecordsCacheKey(date, classId, cohortId)
  return getLocalCache<AttendanceRecord[]>(key, [])
}

// Local Attendance Status Map (Save what teacher marked offline so page refresh doesn't lose it)
export interface OfflineAttendanceDraft {
  date: string
  classId: string
  cohortId: string
  sessionId?: string
  statusMap: Array<[string, { status: string; justification?: string }]>
  timestamp: number
}

export function saveAttendanceDraft(draft: OfflineAttendanceDraft): void {
  const key = `draft_${draft.date}_${draft.classId}_${draft.cohortId}`
  setLocalCache(key, draft)
}

export function getAttendanceDraft(date: string, classId: string, cohortId: string): OfflineAttendanceDraft | null {
  const key = `draft_${date}_${classId}_${cohortId}`
  return getLocalCache<OfflineAttendanceDraft | null>(key, null)
}

// Offline Auth User Caching
export interface OfflineUser {
  id: string
  email?: string
  role?: string
  full_name?: string
  cachedAt: number
}

export function saveOfflineUser(user: OfflineUser): void {
  setLocalCache("auth_user", user)
}

export function getOfflineUser(): OfflineUser | null {
  return getLocalCache<OfflineUser | null>("auth_user", null)
}

export function clearOfflineUser(): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(PREFIX + "auth_user")
  } catch {}
}

