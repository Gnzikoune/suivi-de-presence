import type { StudentStats } from "./types"
import * as XLSX from "xlsx"

export function exportStudentStatsToExcel(
  stats: StudentStats[],
  title: string
): void {
  const headers = [
    "Nom",
    "Prénom",
    "Classe",
    "Jours présents",
    "Jours absents",
    "Jours total",
    "Taux présence (%)",
    "Taux absentéisme (%)",
  ]

  const data = stats.map((s) => [
    s.student.lastName,
    s.student.firstName,
    s.student.classId === "morning" ? "Matin" : "Après-midi",
    s.daysPresent,
    s.daysAbsent,
    s.totalDays,
    s.presenceRate,
    s.absenteeismRate,
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Statistiques")

  XLSX.writeFile(workbook, `${title}.xlsx`)
}

export function exportGlobalSummaryToExcel(data: {
  morningPresenceRate: number
  morningAbsenteeismRate: number
  afternoonPresenceRate: number
  afternoonAbsenteeismRate: number
  globalPresenceRate: number
  globalAbsenteeismRate: number
  morningStudents: number
  afternoonStudents: number
  totalStudents: number
  elapsedDays: number
  totalDays: number
}): void {
  const wsData = [
    ["Résumé Global - Suivi de Présence"],
    [],
    ["Jours écoulés", data.elapsedDays],
    ["Jours total formation", data.totalDays],
    ["Total apprenants", data.totalStudents],
    [],
    ["Classe", "Effectif", "Taux présence (%)", "Taux absentéisme (%)"],
    [
      "Matin",
      data.morningStudents,
      data.morningPresenceRate,
      data.morningAbsenteeismRate,
    ],
    [
      "Après-midi",
      data.afternoonStudents,
      data.afternoonPresenceRate,
      data.afternoonAbsenteeismRate,
    ],
    [
      "Global",
      data.totalStudents,
      data.globalPresenceRate,
      data.globalAbsenteeismRate,
    ],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(wsData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Résumé")

  XLSX.writeFile(workbook, "resume-global-presence.xlsx")
}

export function exportCohortsToExcel(cohorts: any[]): void {
  const headers = [
    "Nom de la cohorte",
    "Campus",
    "Date de début",
    "Date de fin",
    "Nombre d'élèves",
  ]

  const data = cohorts.map((c) => [
    c.name,
    c.campuses?.name || "N/A",
    c.start_date || "N/A",
    c.end_date || "N/A",
    c.studentCount || 0,
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cohortes")

  XLSX.writeFile(workbook, "liste-des-cohortes.xlsx")
}

export function exportDetailedCohortToExcel(
  cohortName: string,
  students: any[],
  sessions: any[],
  records: any[]
): void {
  // 1. Sort sessions by date (oldest to newest for the grid)
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // 2. Build headers: Name, Prev, then one column per session date
  const headers = ["Nom", "Prénom", ...sortedSessions.map(s => s.date)]

  // 3. Build data rows
  const data = students.map((student) => {
    const row = [student.lastName, student.firstName]
    
    // Add status for each session
    sortedSessions.forEach((session) => {
      const record = records.find(r => r.student_id === student.id && r.session_id === session.id)
      let status = "-"
      if (record) {
        if (record.status === 'present') status = "P"
        else if (record.status === 'absent') status = "A"
        else if (record.status === 'late') status = "L"
        else if (record.status === 'excused') status = "E"
      }
      row.push(status)
    })
    
    return row
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Présences")

  // Legend sheet
  const legend = [
    ["Légende"],
    ["P", "Présent"],
    ["A", "Absent"],
    ["L", "En retard"],
    ["E", "Excuse"],
    ["-", "Pas de données"]
  ]
  const wsLegend = XLSX.utils.aoa_to_sheet(legend)
  XLSX.utils.book_append_sheet(workbook, wsLegend, "Légende")

  XLSX.writeFile(workbook, `rapport-detaille-${cohortName.replace(/\s+/g, '-').toLowerCase()}.xlsx`)
}
