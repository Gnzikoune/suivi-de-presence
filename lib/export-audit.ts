import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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

function formatDateFr(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    return d.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return isoDate
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
 * Exporte les logs d'audit au format CSV (compatible Excel avec BOM UTF-8)
 */
export function exportAuditLogsToCSV(logs: AuditLogItem[], month?: string | null): void {
  const headers = ["Date & Heure", "Utilisateur", "Action", "Cible", "Identifiant Cible", "Détails"]

  const rows = logs.map((log) => [
    formatDateFr(log.created_at),
    log.actor_name || "Système",
    log.action || "",
    log.target_type || "-",
    log.target_id || "-",
    (log.message || "").replace(/"/g, '""'),
  ])

  const csvContent = [
    headers.map((h) => `"${h}"`).join(";"),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
  ].join("\r\n")

  // Ajout du BOM UTF-8 (\uFEFF) pour une ouverture parfaite dans Excel avec les accents français
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

  // Metadonnées sous l'en-tête
  doc.setTextColor(51, 65, 85) // Slate 700
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Période sélectionnée : ${periodLabel}`, 14, 32)
  doc.text(`Exporté le : ${nowFr}`, 14, 37)
  doc.text(`Nombre d'enregistrements : ${logs.length}`, 200, 32)

  // Tableau
  const tableData = logs.map((log) => [
    formatDateFr(log.created_at),
    log.actor_name || "Système",
    log.action || "",
    log.target_type || "-",
    log.message || "-",
  ])

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
      0: { cellWidth: 38 }, // Date
      1: { cellWidth: 40 }, // Utilisateur
      2: { cellWidth: 45 }, // Action
      3: { cellWidth: 30 }, // Cible
      4: { cellWidth: "auto" }, // Détails
    },
    didDrawPage: (data) => {
      // Pied de page avec numérotation
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
