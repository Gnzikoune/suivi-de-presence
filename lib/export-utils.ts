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
