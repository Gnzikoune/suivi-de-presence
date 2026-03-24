"use client"

import { useState } from "react"
import useSWR from "swr"
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  RefreshCcw,
  MessageSquare,
  Users,
  Building2,
  GraduationCap
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ConfirmModal } from "@/components/confirm-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchSettings, fetchProfile, fetchCampuses, fetchCohorts } from "@/lib/api-service"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Fetch failed')
  return res.json()
}

export default function AnnouncementsPage() {
  const { data: announcements, mutate, isLoading } = useSWR("/api/super-admin/announcements", fetcher)
  const { data: campuses } = useSWR("/api/campuses", fetcher)
  const { data: cohorts } = useSWR("/api/cohorts", fetcher)
  
  const [isActionPending, setIsActionPending] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      target_role: formData.get("target_role") as string,
      campus_id: formData.get("campus_id") as string,
      cohort_id: formData.get("cohort_id") as string
    }

    setIsActionPending(true)
    try {
      const res = await fetch("/api/super-admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error()
      toast.success("Annonce publiée !")
      mutate()
      e.currentTarget.reset()
    } catch (err) {
      toast.error("Erreur lors de la publication")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleDelete = async () => {
    if (!announcementToDelete) return
    setIsActionPending(true)
    try {
      const res = await fetch(`/api/super-admin/announcements?id=${announcementToDelete}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Annonce supprimée")
      mutate()
      setAnnouncementToDelete(null)
    } catch (err) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setIsActionPending(false)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Gestion des Annonces" 
        description="Publiez des messages importants pour les membres de votre équipe."
      >
        <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-2">
          <RefreshCcw className={isActionPending || isLoading ? "size-4 animate-spin" : "size-4"} />
          <span>Actualiser</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
        <Card className="lg:col-span-1 shadow-sm h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Nouvelle Annonce</CardTitle>
            <CardDescription>Diffusez une information sur le dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Titre</label>
                <input name="title" required className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: Maintenance prévue" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Message</label>
                <textarea name="message" required className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]" placeholder="Détails de l'annonce..." />
              </div>
              
              <div className="divider h-px bg-border my-2" />
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Users className="size-3" /> Cible (Rôle)</label>
                <select name="target_role" className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="all">Tout le monde</option>
                  <option value="coach">Coachs uniquement</option>
                  <option value="campus_manager">Campus Managers uniquement</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Building2 className="size-3" /> Campus</label>
                  <select name="campus_id" className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="all">Tous</option>
                    {campuses?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><GraduationCap className="size-3" /> Cohorte</label>
                  <select name="cohort_id" className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="all">Toutes</option>
                    {cohorts?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <Button type="submit" className="w-full gap-2 font-bold mt-2" disabled={isActionPending}>
                {isActionPending ? <RefreshCcw className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                <span>Publier l'annonce</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm min-h-[600px]">
          <CardHeader>
            <CardTitle className="text-lg">Annonces Publiées</CardTitle>
            <CardDescription>Historique des messages diffusés.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border animate-pulse space-y-3">
                       <Skeleton className="h-4 w-1/3" />
                       <Skeleton className="h-10 w-full" />
                       <Skeleton className="h-3 w-1/4" />
                    </div>
                  ))
                ) : announcements?.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                    <MessageSquare className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground font-medium">Aucune annonce publiée.</p>
                  </div>
                ) : (
                  announcements?.map((a: any) => (
                    <motion.div
                      key={a.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-5 rounded-2xl border bg-card hover:border-primary/30 transition-all relative group shadow-sm overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      
                      <div className="flex items-start justify-between mb-3 pl-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-base tracking-tight">{a.title}</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest">{a.target_role === 'all' ? 'Tous' : a.target_role.replace('_', ' ')}</Badge>
                            {a.campuses && (
                              <Badge variant="secondary" className="text-[9px] uppercase bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
                                <Building2 className="size-2.5" /> {a.campuses.name}
                              </Badge>
                            )}
                            {a.cohorts && (
                              <Badge variant="secondary" className="text-[9px] uppercase bg-purple-50 text-purple-700 border-purple-100 flex items-center gap-1">
                                <GraduationCap className="size-2.5" /> {a.cohorts.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 -mt-1"
                          onClick={() => setAnnouncementToDelete(a.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-foreground/80 mb-4 whitespace-pre-wrap pl-2 leading-relaxed">{a.message}</p>
                      
                      <div className="flex items-center justify-between pl-2 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                            {a.author_name?.charAt(0)}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">Par {a.author_name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal 
        open={!!announcementToDelete}
        onOpenChange={(open) => !open && setAnnouncementToDelete(null)}
        onConfirm={handleDelete}
        loading={isActionPending}
        title="Supprimer l'annonce"
        description="Cette annonce ne sera plus visible sur le dashboard des utilisateurs concernés."
      />
    </div>
  )
}
