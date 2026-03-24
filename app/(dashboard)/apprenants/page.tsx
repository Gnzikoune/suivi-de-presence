"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { Plus, Search, Pencil, Trash2, Users, Sun, Moon, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { StudentForm } from "@/components/student-form"
import { StudentUpload } from "@/components/student-upload"
import { ConfirmModal } from "@/components/confirm-modal"
import { useSyncQueue } from "@/hooks/use-sync-queue"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  deleteStudent,
  fetchCohorts
} from "@/lib/api-service"
import type { Student, ClassId } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { TableSkeleton } from "@/components/table-skeleton"

export default function ApprenantsPage() {
  const { isOnline, queue, isSyncing, addToQueue, sync } = useSyncQueue()
  const { data: students = [], isLoading } = useSWR("students", () => fetchStudents())
  const { data: cohorts = [] } = useSWR("cohorts", () => fetchCohorts())

  const [search, setSearch] = useState("")
  const [cohortFilter, setCohortFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [isActionPending, setIsActionPending] = useState(false)

  const filtered = useMemo(() => {
    let result = students
    if (cohortFilter !== "all") {
      result = result.filter((s) => s.cohortId === cohortFilter)
    }

    if (periodFilter !== "all") {
      result = result.filter((s) => s.classId === periodFilter)
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
  }, [students, cohortFilter, periodFilter, search])

  const handleAdd = useCallback(
    async (data: { firstName: string; lastName: string; cohortId: string; classId?: ClassId; email?: string }) => {
      if (!isOnline) {
        addToQueue('ADD_STUDENT', data)
        setFormOpen(false)
        return
      }
      try {
        await addStudent(data.firstName, data.lastName, data.classId || 'morning', data.email, data.cohortId)
        await mutate("students")
        toast.success("Apprenant ajouté avec succès")
        setFormOpen(false)
      } catch (error) {
        toast.error("Erreur serveur. L'opération a été mise en attente localement.")
        addToQueue('ADD_STUDENT', data)
        setFormOpen(false)
      }
    },
    [isOnline, addToQueue]
  )

  const handleEdit = useCallback(
    async (data: { firstName: string; lastName: string; cohortId: string; classId?: ClassId; email?: string }) => {
      if (!editingStudent) return
      const payload = { id: editingStudent.id, updates: data }

      if (!isOnline) {
        addToQueue('UPDATE_STUDENT', payload)
        setEditingStudent(null)
        setFormOpen(false)
        return
      }

      try {
        await updateStudent(editingStudent.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          cohortId: data.cohortId,
          classId: data.classId
        })
        await mutate("students")
        setEditingStudent(null)
        setFormOpen(false)
        toast.success("Apprenant modifié avec succès")
      } catch (error) {
        toast.error("Erreur serveur. Modification mise en attente localement.")
        addToQueue('UPDATE_STUDENT', payload)
        setEditingStudent(null)
        setFormOpen(false)
      }
    },
    [editingStudent, isOnline, addToQueue]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    const payload = { id: deleteTarget.id }

    setIsActionPending(true)
    try {
      if (!isOnline) {
        addToQueue('DELETE_STUDENT', payload)
        setDeleteTarget(null)
        return
      }

      await deleteStudent(deleteTarget.id)
      await mutate("students")
      mutate("records")
      setDeleteTarget(null)
      toast.success("Apprenant supprimé avec succès")
    } catch (error) {
      toast.error("Erreur serveur. Suppression mise en attente localement.")
      addToQueue('DELETE_STUDENT', payload, true)
      setDeleteTarget(null)
    } finally {
      setIsActionPending(false)
    }
  }, [deleteTarget, isOnline, addToQueue])

  const handleClearAll = useCallback(() => {
    // Note: clearAllStudents non implémenté côté API pour raison de sécurité
    toast.error("La suppression en masse n'est pas encore disponible sur Supabase")
    setClearConfirmOpen(false)
  }, [])

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Gestion des Apprenants"
        description={`${students.length} apprenant${students.length !== 1 ? "s" : ""} au total`}
      >
        {/* Connection Status & Sync */}
        <div className="flex items-center gap-2 mr-2">
          {isOnline ? (
            <Badge variant="outline" className="bg-success/5 text-success border-success/20 gap-1 hidden sm:flex">
              <Wifi className="size-3" /> En ligne
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 gap-1">
              <WifiOff className="size-3" /> Hors-ligne
            </Badge>
          )}

          {queue.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => sync()}
              disabled={isSyncing || !isOnline}
              className="h-8 gap-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
            >
              <RefreshCw className={cn("size-3", isSyncing && "animate-spin")} />
              <span className="text-xs font-bold">{queue.length}</span>
            </Button>
          )}
        </div>
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
        <StudentUpload onSuccess={async () => mutate("students")} cohorts={cohorts} />
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
            <div className="flex items-center gap-3">
              <Tabs
                value={cohortFilter}
                onValueChange={setCohortFilter}
                className="w-full sm:w-auto"
              >
                <TabsList className="flex h-10 w-full sm:w-auto p-1 bg-muted/50 backdrop-blur-sm border overflow-x-auto">
                  <TabsTrigger 
                    value="all"
                    className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm px-4"
                  >
                    <Users className="size-3.5" />
                    <span>Tous</span>
                  </TabsTrigger>
                  {cohorts.map(c => (
                    <TabsTrigger 
                      key={c.id}
                      value={c.id}
                      className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 whitespace-nowrap"
                    >
                      <span>{c.name}{c.campuses?.name ? ` - ${c.campuses.name}` : ""}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-40 h-10 bg-muted/50">
                  <div className="flex items-center gap-2">
                    {periodFilter === 'morning' ? <Sun className="size-3.5" /> : periodFilter === 'afternoon' ? <Moon className="size-3.5" /> : <Users className="size-3.5" />}
                    <SelectValue placeholder="Période" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="morning">Matin</SelectItem>
                  <SelectItem value="afternoon">Après-midi</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <TableHead>Cohorte</TableHead>
                  <TableHead>Période</TableHead>
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
                        {(() => {
                          const c = cohorts.find(ch => ch.id === student.cohortId)
                          if (!c) return <span className="text-xs text-muted-foreground">-</span>
                          return (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            >
                              {c.name}{c.campuses?.name ? ` - ${c.campuses.name}` : ""}
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        {student.classId === 'morning' ? (
                          <Badge variant="outline" className="gap-1 border-orange-200 bg-orange-50 text-orange-700">
                            <Sun className="size-3" /> Matin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700">
                            <Moon className="size-3" /> Après-midi
                          </Badge>
                        )}
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
        cohorts={cohorts}
        onSubmit={editingStudent ? handleEdit : handleAdd}
      />

      {/* Confirmation Modals */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isActionPending}
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer ${deleteTarget?.firstName} ${deleteTarget?.lastName} ? Cette action supprimera également toutes ses données de présence.`}
      />

      <ConfirmModal
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        onConfirm={handleClearAll}
        loading={isActionPending}
        title="Vider la liste des apprenants ?"
        description="Cette action supprimera TOUS les apprenants ainsi que TOUTES les données de présence. Cette opération est irréversible."
      />
    </div>
  )
}
