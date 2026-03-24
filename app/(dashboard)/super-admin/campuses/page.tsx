"use client"

import { useState } from "react"
import useSWR from "swr"
import { 
  MapPin, 
  Plus, 
  Trash2, 
  RefreshCcw,
  Building2,
  AlertCircle
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ConfirmModal } from "@/components/confirm-modal"
import { CampusForm } from "@/components/campus-form"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchCampuses, createCampus, deleteCampus } from "@/lib/api-service"

export default function CampusesPage() {
  const { data: campuses, mutate, isLoading } = useSWR("campuses", fetchCampuses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isActionPending, setIsActionPending] = useState(false)
  const [campusToDelete, setCampusToDelete] = useState<string | null>(null)

  const handleCreate = async (data: { name: string }) => {
    setIsActionPending(true)
    try {
      await createCampus(data.name)
      toast.success("Campus créé avec succès")
      mutate()
      setIsModalOpen(false)
    } catch (error) {
      toast.error("Erreur lors de la création du campus")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleDelete = async () => {
    if (!campusToDelete) return
    setIsActionPending(true)
    try {
      await deleteCampus(campusToDelete)
      toast.success("Campus supprimé")
      mutate()
      setCampusToDelete(null)
    } catch (error) {
      toast.error("Impossible de supprimer le campus (vérifiez s'il contient des cohortes)")
    } finally {
      setIsActionPending(false)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Gestion des Campus" 
        description="Gérez les sites géographiques de votre centre de formation."
      >
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          <span>Ajouter un Campus</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : campuses?.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                <Building2 className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">Aucun campus enregistré.</p>
                <Button variant="link" onClick={() => setIsModalOpen(true)}>Créer votre premier campus</Button>
              </div>
            ) : (
              campuses?.map((campus: any) => (
                <motion.div
                  key={campus.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="group hover:border-primary/50 transition-all shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/10"
                        onClick={() => setCampusToDelete(campus.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <MapPin className="size-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Site Géographique</span>
                      </div>
                      <CardTitle className="text-lg tracking-tight">{campus.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 w-fit px-2 py-1 rounded-full">
                         <Building2 className="size-3" />
                         ID: {campus.id.slice(0, 8)}...
                       </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <Card className="bg-primary/5 border-primary/20 shadow-none border-dashed">
          <CardContent className="pt-6 flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
              <AlertCircle className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm">À propos des Campus</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Les campus permettent de regrouper les cohortes par lieu physique. 
                Supprimer un campus n'est possible que si aucune cohorte n'y est plus rattachée.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CampusForm 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreate}
        loading={isActionPending}
      />

      <ConfirmModal 
        open={!!campusToDelete}
        onOpenChange={(open) => !open && setCampusToDelete(null)}
        onConfirm={handleDelete}
        loading={isActionPending}
        title="Supprimer le campus"
        description="Êtes-vous sûr de vouloir supprimer ce campus ? Cette action échouera s'il reste des cohortes actives liées à ce site."
      />
    </div>
  )
}
