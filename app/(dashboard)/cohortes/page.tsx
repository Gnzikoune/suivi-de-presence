"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { Plus, GraduationCap, Calendar, MapPin, Loader2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  fetchCohorts, 
  createCohort, 
  fetchCampuses,
  createCampus,
  deleteCampus,
  deleteCohort
} from "@/lib/api-service"
import { exportCohortsToExcel } from "@/lib/export-utils"
import { ConfirmModal } from "@/components/confirm-modal"
import { CampusSkeleton, CohortCardSkeleton } from "@/components/cohort-skeleton"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CohortesPage() {
  const { data: cohorts, isLoading: loadingCohorts } = useSWR("cohorts", fetchCohorts)
  const { data: campuses, isLoading: loadingCampuses } = useSWR("campuses", fetchCampuses)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCampusDialogOpen, setIsCampusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCampusDeleteDialogOpen, setIsCampusDeleteDialogOpen] = useState(false)
  const [cohortToDelete, setCohortToDelete] = useState<any>(null)
  const [campusToDelete, setCampusToDelete] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    campusId: "",
    startDate: "",
    endDate: ""
  })

  const [campusName, setCampusName] = useState("")
  const router = useRouter()

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.campusId) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    setSubmitting(true)
    try {
      await createCohort(formData)
      toast.success("Cohorte créée avec succès")
      await mutate("cohorts")
      setIsDialogOpen(false)
      setFormData({ name: "", campusId: "", startDate: "", endDate: "" })
    } catch (error) {
      toast.error("Erreur lors de la création")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campusName) return

    setSubmitting(true)
    try {
      await createCampus(campusName)
      toast.success("Campus ajouté")
      await mutate("campuses")
      setIsCampusDialogOpen(false)
      setCampusName("")
    } catch (error) {
      toast.error("Erreur lors de l'ajout")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCampus = async () => {
    if (!campusToDelete) return
    setSubmitting(true)
    try {
      await deleteCampus(campusToDelete.id)
      toast.success("Campus supprimé")
      await mutate("campuses")
      await mutate("cohorts")
      setIsCampusDeleteDialogOpen(false)
      setCampusToDelete(null)
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCohort = async () => {
    if (!cohortToDelete) return
    setSubmitting(true)
    try {
      await deleteCohort(cohortToDelete.id)
      toast.success("Cohorte supprimée")
      await mutate("cohorts")
      setIsDeleteDialogOpen(false)
      setCohortToDelete(null)
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <PageHeader 
        title="Gestion des Cohortes" 
        description="Organisez vos groupes d'apprenants par campus et période."
      >
        <div className="flex gap-2">
          <Dialog open={isCampusDialogOpen} onOpenChange={setIsCampusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <MapPin className="size-4 mr-2" />
                Nouveau Campus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Campus</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCampus} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nom du Campus</Label>
                  <Input 
                    placeholder="ex: Libreville, Port-Gentil..." 
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" /> : "Ajouter"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4 mr-2" />
                Nouvelle Cohorte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Cohorte</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCohort} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nom de la Cohorte</Label>
                  <Input 
                    placeholder="ex: Dev Web 2024" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campus</Label>
                  <Select 
                    value={formData.campusId} 
                    onValueChange={(v) => setFormData({...formData, campusId: v})}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Input 
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Input 
                      type="date" 
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" /> : "Créer la cohorte"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="p-4 md:p-6 pb-24 max-w-7xl mx-auto w-full space-y-12">
        {/* Campuses Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="size-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Campus Actifs</h2>
          </div>
          
          <div className="flex flex-wrap gap-3 p-6 bg-card rounded-2xl border shadow-sm min-h-[100px] items-center">
            {loadingCampuses ? (
              <CampusSkeleton />
            ) : campuses?.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-8 text-center">
                <div className="p-4 bg-muted/20 rounded-full mb-4">
                  <MapPin className="size-10 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Aucun campus</h3>
                <p className="text-sm text-muted-foreground italic">
                  Aucun campus configuré. Commencez par en ajouter un via le bouton en haut à droite.
                </p>
              </div>
            ) : (
              campuses?.map((campus: any) => (
                <Badge 
                  key={campus.id} 
                  variant="secondary" 
                  className="pl-4 pr-1 py-1 text-sm bg-background hover:bg-muted border shadow-sm flex items-center gap-2 transition-all cursor-default group/badge"
                >
                  <MapPin className="size-3.5 text-primary" />
                  <span className="font-medium">{campus.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-6 rounded-full opacity-0 group-hover/badge:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    onClick={() => {
                      setCampusToDelete(campus)
                      setIsCampusDeleteDialogOpen(true)
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </Badge>
              ))
            )}
          </div>
        </section>

        {/* Cohorts Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="size-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Cohortes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingCohorts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <CohortCardSkeleton key={i} />
              ))
            ) : cohorts?.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card rounded-2xl border-2 border-dashed border-muted-foreground/20">
                <div className="p-4 bg-muted/20 rounded-full mb-4">
                  <GraduationCap className="size-10 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Aucune cohorte</h3>
                <p className="text-sm text-muted-foreground italic mt-2">
                  Créez votre première cohorte pour commencer à gérer vos apprenants et leurs présences.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-6 gap-2"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  Nouvelle Cohorte
                </Button>
              </div>
            ) : (
              cohorts?.map((cohort: any) => (
                <Card key={cohort.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-all group bg-card">
                  <CardHeader className="bg-primary/5 py-4 border-b">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-background rounded-lg shadow-sm">
                        <GraduationCap className="size-5 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                        {cohort.campuses?.name || "Sans campus"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <CardTitle className="text-lg font-bold mb-5 leading-tight group-hover:text-primary transition-colors">
                      {cohort.name}
                    </CardTitle>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="p-1.5 bg-muted/50 rounded-md">
                          <Calendar className="size-4" />
                        </div>
                        <span className="font-medium">
                          {cohort.start_date ? format(new Date(cohort.start_date), "MMM yyyy", { locale: fr }) : "Début non défini"} - 
                          {cohort.end_date ? format(new Date(cohort.end_date), "MMM yyyy", { locale: fr }) : "Fin non définie"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="p-1.5 bg-muted/50 rounded-md">
                          <MapPin className="size-4" />
                        </div>
                        <span className="font-medium">{cohort.campuses?.name || "Localisation non définie"}</span>
                      </div>
                    </div>
                    <div className="mt-8 pt-4 border-t flex justify-end gap-2">
                       <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold" onClick={() => router.push(`/cohortes/${cohort.id}`)}>
                        Gérer
                      </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                          onClick={() => {
                            setCohortToDelete(cohort)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
      <ConfirmModal 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteCohort}
        loading={submitting}
        variant="destructive"
        title="Supprimer la cohorte ?"
        description={`Êtes-vous sûr de vouloir supprimer la cohorte "${cohortToDelete?.name}" ? Cette action détachera tous les apprenants rattachés.`}
        confirmText="Supprimer définitivement"
      />

      <ConfirmModal 
        open={isCampusDeleteDialogOpen}
        onOpenChange={setIsCampusDeleteDialogOpen}
        onConfirm={handleDeleteCampus}
        loading={submitting}
        variant="destructive"
        title="Supprimer ce campus ?"
        description={`Attention : La suppression du campus "${campusToDelete?.name}" entraînera la suppression de TOUTES les cohortes et données de présence associées. Cette action est irréversible.`}
        confirmText="Confirmer la suppression totale"
      />
    </PageShell>
  )
}
