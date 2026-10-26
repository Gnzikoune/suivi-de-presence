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

export interface AuditExportMetadata {
  establishmentName?: string
  formationName?: string
  campusName?: string
  authorName?: string
  logoUrl?: string
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
      full: `${dateStr} à ${timeStr}`,
    }
  } catch {
    return { date: isoDate, time: "", full: isoDate }
  }
}

function getPeriodLabel(monthStr?: string | null): string {
  if (!monthStr || monthStr === "all") return "Historique complet"
  const [year, month] = monthStr.split("-")
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1)
  const monthName = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  return monthName.charAt(0).toUpperCase() + monthName.slice(1)
}

/**
 * Exporte les logs d'audit au format CSV optimisé pour Microsoft Excel
 */
export function exportAuditLogsToCSV(
  logs: AuditLogItem[],
  month?: string | null,
  metadata?: AuditExportMetadata
): void {
  const establishment = metadata?.establishmentName || "Suivi de Présence"
  const formation = metadata?.formationName || "Formation Professionnelle"
  const period = getPeriodLabel(month)

  const headers = [
    "Date",
    "Heure",
    "Utilisateur",
    "Action",
    "Code Action",
    "Type Cible",
    "ID Cible",
    "Détails de l'action",
    "Établissement",
    "Formation",
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
      establishment.replace(/"/g, '""'),
      formation.replace(/"/g, '""'),
    ]
  })

  // Directive 'sep=;' pour forcer la reconnaissance automatique sous Excel
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
 * Avec en-tête institutionnel (Établissement, Formation, Période) et colonnes calibrées
 */
export function exportAuditLogsToExcel(
  logs: AuditLogItem[],
  month?: string | null,
  metadata?: AuditExportMetadata
): void {
  const establishment = metadata?.establishmentName || "Suivi de Présence"
  const formation = metadata?.formationName || "Formation Professionnelle"
  const campus = metadata?.campusName || "Campus Principal"
  const period = getPeriodLabel(month)
  const nowFr = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Bloc d'en-tête corporate dans la feuille Excel
  const wsData: any[][] = [
    ["JOURNAL D'AUDIT SYSTÈME & TRAÇABILITÉ"],
    ["Établissement :", establishment, "", "Période auditée :", period],
    ["Formation :", formation, "", "Date d'extraction :", nowFr],
    ["Campus :", campus, "", "Opérateur :", metadata?.authorName || "Administration"],
    [],
    [
      "Date",
      "Heure",
      "Utilisateur",
      "Action",
      "Code Action",
      "Type Cible",
      "ID Cible",
      "Détails de l'action",
    ],
  ]

  logs.forEach((log) => {
    const { date, time } = formatDateParts(log.created_at)
    wsData.push([
      date,
      time,
      log.actor_name || "Système",
      getActionReadableLabel(log.action),
      log.action || "",
      log.target_type || "-",
      log.target_id || "-",
      (log.message || "").replace(/[\r\n]+/g, " ").trim(),
    ])
  })

  const worksheet = XLSX.utils.aoa_to_sheet(wsData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Journal d'audit")

  // Largeurs de colonnes ajustées
  worksheet["!cols"] = [
    { wch: 14 }, // Date
    { wch: 12 }, // Heure
    { wch: 24 }, // Utilisateur
    { wch: 28 }, // Action
    { wch: 20 }, // Code Action
    { wch: 16 }, // Type Cible
    { wch: 22 }, // ID Cible
    { wch: 55 }, // Détails
  ]

  const periodSlug = month && month !== "all" ? month : "complet"
  XLSX.writeFile(workbook, `journal-audit-${periodSlug}.xlsx`)
}

/**
 * Exporte les logs d'audit au format PDF haut de gamme et ultra-professionnel
 * - Couleurs officielles de l'application (Slate 900, Indigo 600, nuances neutres élégantes)
 * - Mention de l'établissement, de la formation, du campus et de l'auteur de l'export
 * - Cartouche de métadonnées institutionnelles structurées
 * - Tableau d'audit paginé avec filtres et footer officiel numéroté
 */
export function exportAuditLogsToPDF(
  logs: AuditLogItem[],
  month?: string | null,
  metadata?: AuditExportMetadata
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const establishmentName = (metadata?.establishmentName || "ÉTABLISSEMENT DE FORMATION").trim()
  const formationName = (metadata?.formationName || "Formation Professionnelle").trim()
  const campusName = (metadata?.campusName || "Campus Principal").trim()
  const authorName = (metadata?.authorName || "Administrateur").trim()
  const periodLabel = getPeriodLabel(month)

  const nowFr = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Calcul du nombre d'acteurs distincts
  const uniqueActors = new Set(logs.map((l) => l.actor_name || "Système")).size

  // ==========================================
  // 1. BANDEAU SUPÉRIEUR BRANDÉ (Slate 900 & Indigo 600)
  // ==========================================
  // Bordure supérieure brandée (Indigo 600)
  doc.setFillColor(79, 70, 229) // #4F46E5 Indigo
  doc.rect(0, 0, 297, 3.5, "F")

  // Fond du bandeau principal (Slate 900)
  doc.setFillColor(15, 23, 42) // #0F172A Slate 900
  doc.rect(0, 3.5, 297, 25.5, "F")

  // Écusson institutionnel vectoriel "SP" (Suivi de Présence)
  doc.setFillColor(79, 70, 229)
  doc.roundedRect(14, 7, 16, 16, 2.5, 2.5, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10.5)
  doc.setFont("helvetica", "bold")
  doc.text("SP", 18.5, 17.5)

  // Nom de l'établissement (en majuscules, clair et percutant)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  const displayEstName = establishmentName.length > 45 ? establishmentName.substring(0, 42) + "..." : establishmentName
  doc.text(displayEstName.toUpperCase(), 34, 14)

  // Sous-titre officiel avec la formation
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(199, 210, 254) // Indigo 200
  const displaySub = `JOURNAL OFFICIEL D'AUDIT SYSTÈME & TRAÇABILITÉ • ${formationName}`
  const clippedSub = displaySub.length > 75 ? displaySub.substring(0, 72) + "..." : displaySub
  doc.text(clippedSub, 34, 21)

  // Badge officiel de certification à droite
  doc.setFillColor(30, 41, 59) // Slate 800
  doc.roundedRect(214, 7.5, 69, 15, 2, 2, "F")
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(165, 180, 252) // Indigo 300
  doc.text("REGISTRE OFFICIEL CERTIFIÉ", 218, 13)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(148, 163, 184) // Slate 400
  doc.text(`Campus : ${campusName}`, 218, 18)

  // ==========================================
  // 2. PANNEAU DE MÉTADONNÉES INSTITUTIONNELLES
  // ==========================================
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.setDrawColor(226, 232, 240) // Slate 200
  doc.setLineWidth(0.3)
  doc.roundedRect(14, 33, 269, 21, 2, 2, "FD")

  // Colonne 1 : Structure & Formation
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(100, 116, 139) // Slate 500
  doc.text("STRUCTURE & FORMATION", 18, 38.5)

  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42) // Slate 900
  doc.text(establishmentName, 18, 44)

  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105) // Slate 600
  doc.text(`Formation : ${formationName}`, 18, 49)

  // Séparateur vertical 1
  doc.setDrawColor(226, 232, 240)
  doc.line(110, 35, 110, 52)

  // Colonne 2 : Cadre d'extraction
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(100, 116, 139)
  doc.text("CADRE D'EXTRACTION", 116, 38.5)

  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text(`Période auditée : ${periodLabel}`, 116, 44)

  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)
  doc.text(`Émis le ${nowFr} par ${authorName}`, 116, 49)

  // Séparateur vertical 2
  doc.line(206, 35, 206, 52)

  // Colonne 3 : Synthèse du registre
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(100, 116, 139)
  doc.text("SYNTHÈSE DU REGISTRE", 212, 38.5)

  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text(`Total : ${logs.length} opération(s)`, 212, 44)

  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)
  doc.text(`Acteurs impliqués : ${uniqueActors} intervenant(s)`, 212, 49)

  // ==========================================
  // 3. TABLEAU DES LOGS D'AUDIT
  // ==========================================
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
    startY: 57,
    head: [["Date & Heure", "Utilisateur", "Action", "Cible", "Détails de l'opération"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      cellPadding: 3,
    },
    styles: {
      fontSize: 7.8,
      cellPadding: 2.8,
      overflow: "linebreak",
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    columnStyles: {
      0: { cellWidth: 36 }, // Date & Heure
      1: { cellWidth: 38 }, // Utilisateur
      2: { cellWidth: 46 }, // Action
      3: { cellWidth: 26 }, // Cible
      4: { cellWidth: "auto" }, // Détails
    },
    didDrawPage: (data) => {
      // Pied de page corporate numéroté
      const footerY = doc.internal.pageSize.height - 10
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.2)
      doc.line(14, footerY - 3, 283, footerY - 3)

      doc.setFontSize(7.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(148, 163, 184)
      doc.text(
        `${establishmentName} • ${formationName} • Suivi de Présence & Traçabilité`,
        14,
        footerY + 1
      )
      doc.text("Document officiel confidentiel", 283, footerY + 1, { align: "right" })
    },
    margin: { top: 57, bottom: 15, left: 14, right: 14 },
  })

  // Deuxième passe pour la pagination totale ("Page X sur Y")
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const footerY = doc.internal.pageSize.height - 10
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 116, 139)
    doc.text(`Page ${i} sur ${totalPages}`, 148, footerY + 1, { align: "center" })
  }

  const periodSlug = month && month !== "all" ? month : "complet"
  doc.save(`journal-audit-${periodSlug}.pdf`)
}
