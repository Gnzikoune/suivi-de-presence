"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { Plus, Search, Pencil, Trash2, Users, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { StudentForm } from "@/components/student-form"
import { StudentUpload } from "@/components/student-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  fetchStudents, 
  addStudent, 
  updateStudent, 
  deleteStudent 
} from "@/lib/api-service"
import type { Student, ClassId } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { TableSkeleton } from "@/components/table-skeleton"

export default function ApprenantsPage() {
  const { data: students = [], isLoading } = useSWR("students", fetchStudents)

  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState<"all" | ClassId>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = students
    if (classFilter !== "all") {
      result = result.filter((s) => s.classId === classFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) =>
      a.lastName.localeCompare(b.lastName, "fr")
    )
  }, [students, classFilter, search])

  const morningCount = students.filter((s) => s.classId === "morning").length
  const afternoonCount = students.filter(
    (s) => s.classId === "afternoon"
  ).length

  const handleAdd = useCallback(
    async (data: { firstName: string; lastName: string; classId: ClassId }) => {
      try {
        await addStudent(data.firstName, data.lastName, data.classId)
        mutate("students")
        toast.success("Apprenant ajouté avec succès")
        setFormOpen(false)
      } catch (error) {
        toast.error("Erreur lors de l'ajout de l'apprenant")
      }
    },
    []
  )

  const handleEdit = useCallback(
    async (data: { firstName: string; lastName: string; classId: ClassId }) => {
      if (!editingStudent) return
      try {
        await updateStudent(editingStudent.id, data)
        mutate("students")
        setEditingStudent(null)
        setFormOpen(false)
        toast.success("Apprenant modifié avec succès")
      } catch (error) {
        toast.error("Erreur lors de la modification")
      }
    },
    [editingStudent]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteStudent(deleteTarget.id)
      mutate("students")
      mutate("records")
      setDeleteTarget(null)
      toast.success("Apprenant supprimé avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }, [deleteTarget])

  const handleClearAll = useCallback(() => {
    // Note: clearAllStudents non implémenté côté API pour raison de sécurité
    toast.error("La suppression en masse n'est pas encore disponible sur Airtable")
    setClearConfirmOpen(false)
  }, [])

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Gestion des Apprenants"
        description={`${students.length} apprenant${students.length !== 1 ? "s" : ""} au total`}
      >
        <Button
          onClick={() => {
            setEditingStudent(null)
            setFormOpen(true)
          }}
          size="sm"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
        <StudentUpload onSuccess={() => mutate("students")} />
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setClearConfirmOpen(true)}
          disabled={students.length === 0}
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Vider la liste</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-4 md:p-6 pb-20 max-w-5xl mx-auto w-full">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={classFilter}
            onValueChange={(v) => setClassFilter(v as "all" | ClassId)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 h-10 w-full sm:w-[450px] p-1 bg-muted/50 backdrop-blur-sm border">
              <TabsTrigger 
                value="all"
                className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="size-3.5" />
                <span className="hidden sm:inline">Toutes ({students.length})</span>
                <span className="sm:hidden">{students.length}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="morning"
                className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Sun className="size-3.5" />
                <span className="hidden sm:inline">Matin ({morningCount})</span>
                <span className="sm:hidden">{morningCount}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="afternoon"
                className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Moon className="size-3.5" />
                <span className="hidden sm:inline">Après-midi ({afternoonCount})</span>
                <span className="sm:hidden">{afternoonCount}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un apprenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton columns={5} rows={8} />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apprenant</TableHead>
                  <TableHead className="hidden md:table-cell">Prénom</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Date d{"'"}ajout
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {students.length === 0
                        ? "Aucun apprenant enregistré. Cliquez sur \"Ajouter\" pour commencer."
                        : "Aucun résultat pour cette recherche."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{student.lastName}</span>
                          <span className="text-xs font-normal text-muted-foreground md:hidden">
                            {student.firstName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.firstName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.classId === "morning"
                              ? "default"
                              : "secondary"
                          }
                          className={cn(
                            "text-[10px] sm:text-xs px-1.5 sm:px-2.5",
                            student.classId === "morning"
                              ? "bg-success text-success-foreground hover:bg-success/90"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          {student.classId === "morning"
                            ? "Matin"
                            : "Après-midi"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {format(parseISO(student.createdAt), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                              setEditingStudent(student)
                              setFormOpen(true)
                            }}
                            aria-label={`Modifier ${student.firstName} ${student.lastName}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(student)}
                            aria-label={`Supprimer ${student.firstName} ${student.lastName}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      <StudentForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingStudent(null)
        }}
        student={editingStudent}
        onSubmit={editingStudent ? handleEdit : handleAdd}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>
                {deleteTarget?.firstName} {deleteTarget?.lastName}
              </strong>{" "}
              ? Cette action supprimera également toutes ses données de présence
              et est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vider la liste des apprenants ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera <strong>TOUS</strong> les apprenants ainsi que 
              <strong>TOUTES</strong> les données de présence enregistrées. 
              Cette opération est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Tout supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
