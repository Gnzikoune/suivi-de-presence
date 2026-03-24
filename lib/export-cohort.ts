import * as XLSX from "xlsx"
import type { Student } from "./types"

export function exportCohortStudentsToExcel(
  cohortName: string,
  students: Student[]
) {
  const data = students.map((s, i) => ({
    "#": i + 1,
    Nom: s.lastName,
    Prénom: s.firstName,
    Période: s.classId === "morning" ? "Matin" : "Après-midi",
    Email: s.email || "-",
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Apprenants")

  // Auto-width columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...data.map((d) => String((d as any)[key]).length)) + 2,
  }))
  ws["!cols"] = colWidths

  XLSX.writeFile(wb, `apprenants-${cohortName.replace(/\s+/g, "-").toLowerCase()}.xlsx`)
}

export function exportCohortStatsToExcel(
  cohortName: string,
  stats: {
    totalStudents: number
    totalSessions: number
    averagePresenceRate: number
  }
) {
  const data = [
    { Indicateur: "Effectif total", Valeur: stats.totalStudents },
    { Indicateur: "Sessions effectuées", Valeur: stats.totalSessions },
    { Indicateur: "Taux de présence moyen (%)", Valeur: stats.averagePresenceRate },
  ]

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Statistiques")
  XLSX.writeFile(wb, `stats-${cohortName.replace(/\s+/g, "-").toLowerCase()}.xlsx`)
}
