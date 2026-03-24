"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ArrowLeft,
  GraduationCap,
  Users,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Download,
  BarChart3,
  UserCheck,
  Clock,
  Loader2,
  Save,
  X
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { StatsCard } from "@/components/stats-cards"
import { ConfirmModal } from "@/components/confirm-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  fetchCohortDetail,
  fetchCohortStats,
  updateCohort,
  deleteCohort,
  fetchStudents,
  fetchSessions,
  fetchCampuses,
  createSession,
} from "@/lib/api-service"
import { exportCohortStudentsToExcel } from "@/lib/export-cohort"
import { exportDetailedCohortToExcel } from "@/lib/export-utils"
import type { Student, Session } from "@/lib/types"

export default function CohortDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cohortId = params.id as string

  // Data fetching
  const { data: cohort, isLoading: loadingCohort } = useSWR(
    cohortId ? `cohort-${cohortId}` : null,
    () => fetchCohortDetail(cohortId)
  )
  const { data: stats } = useSWR(
    cohortId ? `cohort-stats-${cohortId}` : null,
    () => fetchCohortStats(cohortId)
  )
  const { data: students = [] } = useSWR(
    cohortId ? `cohort-students-${cohortId}` : null,
    () => fetchStudents(cohortId)
  )
  const { data: sessions = [] } = useSWR(
    cohortId ? `cohort-sessions-${cohortId}` : null,
    () => fetchSessions()
  )
  const { data: campuses } = useSWR("campuses", fetchCampuses)

  // Filter sessions for this cohort
  const cohortSessions = useMemo(
    () => sessions.filter((s: Session) => s.cohortId === cohortId)
      .sort((a: Session, b: Session) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sessions, cohortId]
  )

  // State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", campusId: "", startDate: "", endDate: "" })
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteCascade, setDeleteCascade] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [sessionForm, setSessionForm] = useState({ date: "", title: "" })
  const [creatingSess, setCreatingSess] = useState(false)

  // Start editing
  const handleStartEdit = () => {
    setEditForm({
      name: cohort?.name || "",
      campusId: cohort?.campus_id || "",
      startDate: cohort?.start_date || "",
      endDate: cohort?.end_date || "",
    })
    setIsEditing(true)
  }

  // Save edit
  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await updateCohort(cohortId, editForm)
      await mutate(`cohort-${cohortId}`)
      setIsEditing(false)
      toast.success("Cohorte mise à jour")
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  // Delete
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCohort(cohortId, deleteCascade)
      toast.success("Cohorte supprimée")
      await mutate("cohorts")
      router.push("/cohortes")
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  // Create session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionForm.date || !sessionForm.title) return
    setCreatingSess(true)
    try {
      await createSession({
        cohortId,
        date: sessionForm.date,
        title: sessionForm.title,
      })
      await mutate(`cohort-sessions-${cohortId}`)
      await mutate(`cohort-stats-${cohortId}`)
      setSessionDialogOpen(false)
      setSessionForm({ date: "", title: "" })
      toast.success("Session créée")
    } catch {
      toast.error("Erreur lors de la création")
    } finally {
      setCreatingSess(false)
    }
  }

  // Export handlers
  const handleExportStudents = () => {
    if (students.length > 0 && cohort) {
      exportCohortStudentsToExcel(cohort.name, students)
    }
  }

  const handleExportStats = () => {
    if (stats?.allSessions && stats?.allStudents && cohort) {
      exportDetailedCohortToExcel(
        cohort.name, 
        stats.allStudents, 
        stats.allSessions, 
        stats.allRecords || []
      )
    } else {
      toast.error("Données de statistiques insuffisantes pour l'export")
    }
  }

  if (loadingCohort) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="size-10 animate-spin text-primary/40" />
          <p className="text-sm text-muted-foreground animate-pulse">Chargement de la cohorte...</p>
        </div>
      </PageShell>
    )
  }

  if (!cohort) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <GraduationCap className="size-12 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold">Cohorte introuvable</h2>
          <Button variant="outline" onClick={() => router.push("/cohortes")}>
            <ArrowLeft className="size-4 mr-2" />
            Retour aux cohortes
          </Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title={isEditing ? "Modification" : cohort.name}
        description={
          isEditing
            ? "Modifiez les informations de la cohorte"
            : `${cohort.campuses?.name || "Sans campus"} · ${cohort.studentCount || 0} apprenant(s)`
        }
      >
        <Button variant="ghost" size="sm" onClick={() => router.push("/cohortes")}>
          <ArrowLeft className="size-4 mr-1" />
          Retour
        </Button>
        {!isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Pencil className="size-4" />
              <span className="hidden sm:inline ml-1">Modifier</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="size-4" />
                  <span className="hidden sm:inline ml-1">Exporter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportStudents}>
                  <Users className="size-4 mr-2" />
                  Liste des apprenants
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportStats}>
                  <BarChart3 className="size-4 mr-2" />
                  Rapport Détaillé (Matrice)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="p-4 md:p-6 pb-24 max-w-5xl mx-auto w-full space-y-6">
        {/* Edit Form */}
        {isEditing && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de la cohorte</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campus</Label>
                  <Select
                    value={editForm.campusId}
                    onValueChange={(v) => setEditForm({ ...editForm, campusId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  <X className="size-4 mr-1" /> Annuler
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Save className="size-4 mr-1" />}
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        {!isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Apprenants"
              value={stats?.totalStudents ?? cohort.studentCount ?? 0}
              icon={Users}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatsCard
              title="Taux de Présence"
              value={`${stats?.averagePresenceRate ?? 0}%`}
              icon={UserCheck}
              iconClassName="bg-success/10 text-success"
            />
            <StatsCard
              title="Sessions"
              value={stats?.totalSessions ?? cohort.sessionCount ?? 0}
              icon={Calendar}
              iconClassName="bg-chart-5/10 text-chart-5"
            />
            <StatsCard
              title="Campus"
              value={cohort.campuses?.name || "-"}
              icon={MapPin}
              iconClassName="bg-warning/10 text-warning-foreground"
            />
          </div>
        )}

        {/* Tabs */}
        {!isEditing && (
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid grid-cols-2 h-12 w-full md:w-[400px] p-1 bg-muted/50 backdrop-blur-sm border">
              <TabsTrigger
                value="students"
                className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="size-4" />
                <span>Apprenants</span>
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Clock className="size-4" />
                <span>Sessions</span>
              </TabsTrigger>
            </TabsList>

            {/* Students Tab */}
            <TabsContent value="students" className="mt-6">
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead className="hidden lg:table-cell">Date d{"'"}ajout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucun apprenant dans cette cohorte.
                        </TableCell>
                      </TableRow>
                    ) : (
                      students
                        .sort((a: Student, b: Student) => a.lastName.localeCompare(b.lastName, "fr"))
                        .map((s: Student, idx: number) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                            <TableCell className="font-medium">{s.lastName}</TableCell>
                            <TableCell>{s.firstName}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  s.classId === "morning"
                                    ? "bg-success/10 text-success border-success/20"
                                    : "bg-primary/10 text-primary border-primary/20"
                                }
                                variant="outline"
                              >
                                {s.classId === "morning" ? "Matin" : "Après-midi"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                              {s.createdAt
                                ? format(new Date(s.createdAt), "dd MMM yyyy", { locale: fr })
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="mt-6 space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setSessionDialogOpen(true)}>
                  <Plus className="size-4 mr-1" />
                  Nouvelle Session
                </Button>
              </div>
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Horaire</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohortSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Aucune session enregistrée pour cette cohorte.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cohortSessions.map((session: Session) => {
                        const sessionDate = new Date(session.date)
                        const now = new Date()
                        const isToday = sessionDate.toDateString() === now.toDateString()
                        const isPast = sessionDate < now && !isToday
                        return (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">
                              {format(sessionDate, "dd MMM yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell>{session.title || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {session.startTime && session.endTime
                                ? `${session.startTime} - ${session.endTime}`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  isToday
                                    ? "bg-success/10 text-success border-success/20"
                                    : isPast
                                      ? "bg-muted text-muted-foreground"
                                      : "bg-primary/10 text-primary border-primary/20"
                                }
                              >
                                {isToday ? "En cours" : isPast ? "Terminée" : "À venir"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={deleting}
        variant="destructive"
        title="Supprimer cette cohorte ?"
        description={
          `Cette cohorte contient ${cohort.studentCount || 0} apprenant(s) et ${cohort.sessionCount || 0} session(s). ` +
          (deleteCascade
            ? "Les apprenants seront SUPPRIMÉS définitivement."
            : "Les apprenants seront détachés de la cohorte (conservés dans le système).")
        }
        confirmText={deleteCascade ? "Tout supprimer" : "Supprimer la cohorte"}
      >
        <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border bg-muted/30">
          <input
            type="checkbox"
            id="cascade"
            checked={deleteCascade}
            onChange={(e) => setDeleteCascade(e.target.checked)}
            className="rounded border-border"
          />
          <Label htmlFor="cascade" className="text-sm cursor-pointer">
            Supprimer aussi les apprenants rattachés
          </Label>
        </div>
      </ConfirmModal>

      {/* New Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                placeholder="ex: Cours JavaScript"
                value={sessionForm.title}
                onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={sessionForm.date}
                onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creatingSess}>
                {creatingSess ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
