"use client"

import { useState, useRef } from "react"
import { FileUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { apiBulkAddStudents, addStudent } from "@/lib/api-service"
import { useSyncQueue } from "@/hooks/use-sync-queue"
import type { ClassId, Cohort } from "@/lib/types"
import * as XLSX from "xlsx"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface StudentUploadProps {
  onSuccess: () => void
  cohorts: Cohort[]
}

export function StudentUpload({ onSuccess, cohorts }: StudentUploadProps) {
  const { isOnline, addToQueue } = useSyncQueue()
  const [uploading, setUploading] = useState(false)
  const [targetCohortId, setTargetCohortId] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verify file extension
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (extension !== "xlsx" && extension !== "xls") {
      toast.error("Veuillez sélectionner un fichier Excel (.xlsx ou .xls).")
      return
    }

    setUploading(true)
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to JSON
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 })
        
        if (rawRows.length < 1) {
          toast.error("Le fichier est vide.")
          return
        }

        const studentsData: { firstName: string; lastName: string; classId: ClassId; cohortId?: string }[] = []
        
        // Find column indices
        const headerRow = rawRows[0] as string[]
        const lastNameIdx = headerRow.findIndex(h => h?.toString().toLowerCase().includes("nom"))
        const firstNameIdx = headerRow.findIndex(h => h?.toString().toLowerCase().includes("prénom") || h?.toString().toLowerCase().includes("prenom"))
        const classIdx = headerRow.findIndex(h => h?.toString().toLowerCase().includes("classe"))

        if (lastNameIdx === -1 || firstNameIdx === -1) {
          toast.error("Colonnes 'Nom' ou 'Prénom' non trouvées dans le fichier.")
          return
        }

        // Process data rows
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i] as any[]
          if (!row || row.length === 0) continue

          const lastName = row[lastNameIdx]?.toString().trim()
          const firstName = row[firstNameIdx]?.toString().trim()
          const classRaw = classIdx !== -1 ? row[classIdx]?.toString().toLowerCase() : ""
          
          let classId: ClassId = "morning" // Default
          if (classRaw && (classRaw.includes("après") || classRaw.includes("apres") || classRaw.includes("afternoon"))) {
            classId = "afternoon"
          }

          if (lastName && firstName) {
            studentsData.push({ 
              firstName, 
              lastName, 
              classId, 
              cohortId: targetCohortId || undefined 
            })
          }
        }

        if (studentsData.length === 0) {
          toast.error("Aucun apprenant trouvé dans le fichier.")
        } else {
          if (!isOnline) {
            studentsData.forEach(s => addToQueue('ADD_STUDENT', s))
            toast.warning(`${studentsData.length} apprenants mis en file d'attente (Hors-ligne).`)
            onSuccess()
            return
          }

          try {
            const { addedCount } = await apiBulkAddStudents(studentsData)
            if (addedCount > 0) {
              toast.success(
                `${addedCount} apprenant(s) importé(s) avec succès.`
              )
              if (addedCount < studentsData.length) {
                toast.warning(`${studentsData.length - addedCount} échec(s). Vérifiez les doublons.`)
              }
            } else {
              toast.error("Aucun apprenant n'a pu être importé.")
              // Maybe add to queue if it's a general server error? 
              // apiBulkAddStudents already loops and logs errors, 
              // so we might not want to queue everything if some are just duplicates.
            }
          } catch (error) {
            toast.error("Erreur lors de l'import : mise en attente des données.")
            studentsData.forEach(s => addToQueue('ADD_STUDENT', s, true))
          }
          onSuccess()
        }
      } catch (error) {
        console.error("Error parsing Excel:", error)
        toast.error("Erreur lors de l'analyse du fichier Excel.")
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }

    reader.onerror = () => {
      toast.error("Erreur lors de la lecture du fichier.")
      setUploading(false)
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <div>
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-2">
        <Select
          value={targetCohortId}
          onValueChange={setTargetCohortId}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Cohorte cible..." />
          </SelectTrigger>
          <SelectContent>
            {cohorts.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}{c.campuses?.name ? ` - ${c.campuses.name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          disabled={uploading || !targetCohortId}
          onClick={() => fileInputRef.current?.click()}
          className="h-9"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileUp className="size-4" />
          )}
          <span className="ml-2 hidden sm:inline">Importer Excel</span>
        </Button>
      </div>
    </div>
  )
}
