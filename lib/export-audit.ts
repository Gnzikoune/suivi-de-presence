import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export interface AuditLogItem {
  id: string
  created_at: string
  action: string
  actor_name?: string
  target_type?: string | null
  target_id?: string | null
  message?: string
  details?: any
}

export function getActionReadableLabel(action: string): string {
  const map: Record<string, string> = {
    LOGIN: "Connexion",
    LOGOUT: "Déconnexion",
    QR_SCAN: "Pointage QR Code",
    SAVE_ATTENDANCE: "Enregistrement de présence",
    COACH_ATTENDANCE: "Pointage formateur",
    CREATE_STUDENT: "Ajout d'un apprenant",
    UPDATE_STUDENT: "Modification d'un apprenant",
    DELETE_STUDENT: "Suppression d'un apprenant",
    CREATE_COHORT: "Création de cohorte",
    UPDATE_COHORT: "Modification de cohorte",
    DELETE_COHORT: "Suppression de cohorte",
    CREATE_FORMATION: "Création de formation",
    DELETE_FORMATION: "Suppression de formation",
    CREATE_CAMPUS: "Création de campus",
    DELETE_CAMPUS: "Suppression de campus",
    CREATE_SESSION: "Création de session",
    SAVE_SETTING: "Modification de paramètre",
    UPDATE_PROFILE: "Mise à jour du profil",
    CREATE_ANNOUNCEMENT: "Publication d'annonce",
    DELETE_ANNOUNCEMENT: "Suppression d'annonce",
    INVITE_USER: "Invitation utilisateur",
    DELETE_USER: "Suppression utilisateur",
    UPDATE_USER_ROLE: "Modification de rôle",
  }
  return map[action] || action
}

function formatDateParts(isoDate: string): { date: string; time: string; full: string } {
  try {
    const d = new Date(isoDate)
    const dateStr = d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const timeStr = d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    return {
      date: dateStr,
      time: timeStr,
      full: `${dateStr} ${timeStr}`,
    }
  } catch {
    return { date: isoDate, time: "", full: isoDate }
  }
}

function getPeriodLabel(monthStr?: string | null): string {
  if (!monthStr || monthStr === "all") return "Toutes les dates"
  const [year, month] = monthStr.split("-")
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1)
  const monthName = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  return monthName.charAt(0).toUpperCase() + monthName.slice(1)
}

/**
 * Exporte les logs d'audit au format CSV optimisé pour Microsoft Excel
 * - BOM UTF-8 (\uFEFF) pour préserver les caractères accentués français
 * - Directive 'sep=;' pour forcer Excel à séparer automatiquement les colonnes
 * - Colonnes Date et Heure séparées pour un tri et filtrage optimal dans Excel
 * - Remplacement des retours chariot pour éviter les sauts de ligne accidentels
 */
export function exportAuditLogsToCSV(logs: AuditLogItem[], month?: string | null): void {
  const headers = [
    "Date",
    "Heure",
    "Utilisateur",
    "Action",
    "Code Action",
    "Type Cible",
    "ID Cible",
    "Détails de l'action",
  ]

  const rows = logs.map((log) => {
    const { date, time } = formatDateParts(log.created_at)
    const cleanMessage = (log.message || "")
      .replace(/[\r\n]+/g, " ")
      .replace(/"/g, '""')
      .trim()

    return [
      date,
      time,
      (log.actor_name || "Système").replace(/"/g, '""'),
      getActionReadableLabel(log.action).replace(/"/g, '""'),
      log.action || "",
      (log.target_type || "-").replace(/"/g, '""'),
      (log.target_id || "-").replace(/"/g, '""'),
      cleanMessage,
    ]
  })

  // Directive 'sep=;' pour qu'Excel ouvre le fichier en colonnes distinctes sans assistant d'importation
  const csvRows = [
    "sep=;",
    headers.map((h) => `"${h}"`).join(";"),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
  ]

  const csvContent = csvRows.join("\r\n")

  // Ajout du BOM UTF-8 (\uFEFF)
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  const periodSlug = month && month !== "all" ? month : "complet"
  link.setAttribute("href", url)
  link.setAttribute("download", `journal-audit-${periodSlug}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporte les logs d'audit au format Excel natif (.xlsx)
 * Idéal pour une consultation immédiate sans configuration de délimiteur
 */
export function exportAuditLogsToExcel(logs: AuditLogItem[], month?: string | null): void {
  const data = logs.map((log) => {
    const { date, time } = formatDateParts(log.created_at)
    return {
      "Date": date,
      "Heure": time,
      "Utilisateur": log.actor_name || "Système",
      "Action": getActionReadableLabel(log.action),
      "Code Action": log.action || "",
      "Type Cible": log.target_type || "-",
      "ID Cible": log.target_id || "-",
      "Détails": (log.message || "").replace(/[\r\n]+/g, " ").trim(),
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Journal d'audit")

  // Ajustement automatique de la largeur des colonnes
  const colWidths = [
    { wch: 14 }, // Date
    { wch: 12 }, // Heure
    { wch: 24 }, // Utilisateur
    { wch: 28 }, // Action
    { wch: 20 }, // Code Action
    { wch: 16 }, // Type Cible
    { wch: 24 }, // ID Cible
    { wch: 50 }, // Détails
  ]
  worksheet["!cols"] = colWidths

  const periodSlug = month && month !== "all" ? month : "complet"
  XLSX.writeFile(workbook, `journal-audit-${periodSlug}.xlsx`)
}

/**
 * Exporte les logs d'audit au format PDF soigné et structuré
 */
export function exportAuditLogsToPDF(logs: AuditLogItem[], month?: string | null): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const periodLabel = getPeriodLabel(month)
  const nowFr = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // En-tête du document
  doc.setFillColor(15, 23, 42) // Slate 900
  doc.rect(0, 0, 297, 24, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("PLATEFORME DE SUIVI DE PRÉSENCE - JOURNAL D'AUDIT", 14, 15)

  // Métadonnées sous l'en-tête
  doc.setTextColor(51, 65, 85) // Slate 700
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Période sélectionnée : ${periodLabel}`, 14, 32)
  doc.text(`Exporté le : ${nowFr}`, 14, 37)
  doc.text(`Nombre d'enregistrements : ${logs.length}`, 200, 32)

  // Tableau
  const tableData = logs.map((log) => {
    const { full } = formatDateParts(log.created_at)
    return [
      full,
      log.actor_name || "Système",
      getActionReadableLabel(log.action),
      log.target_type || "-",
      log.message || "-",
    ]
  })

  autoTable(doc, {
    startY: 42,
    head: [["Date & Heure", "Utilisateur", "Action", "Cible", "Détails de l'action"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 38 }, // Date & Heure
      1: { cellWidth: 38 }, // Utilisateur
      2: { cellWidth: 45 }, // Action
      3: { cellWidth: 28 }, // Cible
      4: { cellWidth: "auto" }, // Détails
    },
    didDrawPage: (data) => {
      const pageNumber = (doc as any).internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Page ${data.pageNumber} sur ${pageNumber} - Document officiel d'audit`,
        14,
        doc.internal.pageSize.height - 8
      )
    },
    margin: { top: 42, bottom: 15, left: 14, right: 14 },
  })

  // Réajuster les numéros de page totaux si multi-pages
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Page ${i} sur ${totalPages} - Document d'audit confidentiel`,
      297 - 75,
      doc.internal.pageSize.height - 8
    )
  }

  const periodSlug = month && month !== "all" ? month : "complet"
  doc.save(`journal-audit-${periodSlug}.pdf`)
}
