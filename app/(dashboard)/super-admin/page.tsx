"use client"

import { Skeleton } from "@/components/ui/skeleton"

import { useState } from "react"
import useSWR from "swr"
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  ShieldCheck, 
  Plus, 
  TrendingUp,
  RefreshCcw,
  Megaphone,
  MessageSquare,
  Trash2,
  Calendar,
  CheckCircle2,
  UserCheck
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ConfirmModal } from "@/components/confirm-modal"
import { FormationForm } from "@/components/formation-form"
import { InviteUserForm } from "@/components/invite-user-form"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // Attach extra info to the error object.
    const info = await res.json()
    ;(error as any).info = info
    ;(error as any).status = res.status
    throw error
  }
  return res.json()
}

export default function SuperAdminPage() {
  const { data: stats, mutate: mutateStats } = useSWR("/api/super-admin/stats", fetcher)
  const { data: formations, mutate: mutateFormations } = useSWR("/api/super-admin/formations", fetcher)
  const { data: users, error: usersError, mutate: mutateUsers } = useSWR("/api/super-admin/users", fetcher)
  const { data: auditLogs, mutate: mutateAudit } = useSWR("/api/super-admin/audit", fetcher)
  const { data: announcements, mutate: mutateAnnouncements } = useSWR("/api/super-admin/announcements", fetcher)
  const { data: campuses } = useSWR("/api/campuses", fetcher)
  const { data: cohorts } = useSWR("/api/cohorts", fetcher)
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const { data: coachAttendance, mutate: mutateCoachAttendance } = useSWR(`/api/coach-presence?date=${selectedDate}`, fetcher)
  
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [isAddingFormation, setIsAddingFormation] = useState(false)
  const [isInvitingUser, setIsInvitingUser] = useState(false)
  
  // Modal visibility states
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)

  // Confirmation Modals State
  const [formationToDelete, setFormationToDelete] = useState<string | null>(null)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null)
  const [userToUpdate, setUserToUpdate] = useState<{ id: string, role: string } | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  const handleAddFormation = async (data: { label: string; value: string }) => {
    setIsAddingFormation(true)
    try {
      const res = await fetch("/api/super-admin/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || "Erreur lors de l'ajout")
      
      toast.success("Formation ajoutée !")
      mutateFormations()
      mutateAudit()
      setIsFormationModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ajout")
    } finally {
      setIsAddingFormation(false)
    }
  }

  const handleDeleteFormation = async () => {
    if (!formationToDelete) return
    setIsActionPending(true)
    try {
      const res = await fetch(`/api/super-admin/formations?id=${formationToDelete}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Formation supprimée")
      mutateFormations()
      mutateAudit()
      setFormationToDelete(null)
    } catch (err) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!userToUpdate) return
    setUpdatingUserId(userToUpdate.id)
    setIsActionPending(true)
    try {
      const res = await fetch("/api/super-admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToUpdate.id, role: userToUpdate.role })
      })
      if (!res.ok) throw new Error()
      toast.success("Rôle mis à jour")
      mutateUsers()
      mutateAudit()
      mutateStats()
      setUserToUpdate(null)
    } catch (err) {
      toast.error("Erreur lors du changement de rôle")
    } finally {
      setUpdatingUserId(null)
      setIsActionPending(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setIsActionPending(true)
    try {
      const res = await fetch(`/api/super-admin/users?id=${userToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Utilisateur supprimé")
      mutateUsers()
      mutateAudit()
      mutateStats()
      setUserToDelete(null)
    } catch (err) {
      toast.error("Erreur lors de la suppression de l'utilisateur")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleInviteUser = async (data: { email: string; role: string; full_name: string; formation?: string }) => {
    setIsInvitingUser(true)
    try {
      const res = await fetch("/api/super-admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || "Erreur lors de l'envoi")
      
      toast.success("Invitation envoyée !")
      mutateUsers()
      mutateAudit()
      setIsInviteModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi")
    } finally {
      setIsInvitingUser(false)
    }
  }

  const handleCreateAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
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
      mutateAnnouncements()
      mutateAudit()
      setIsAnnouncementModalOpen(false)
    } catch (err) {
      toast.error("Erreur lors de la publication")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return
    setIsActionPending(true)
    try {
      const res = await fetch(`/api/super-admin/announcements?id=${announcementToDelete}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Annonce supprimée")
      mutateAnnouncements()
      mutateAudit()
      setAnnouncementToDelete(null)
    } catch (err) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleCoachStatus = async (coachId: string, status: string) => {
    setIsActionPending(true)
    try {
      const res = await fetch("/api/coach-presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coach_id: coachId, date: selectedDate, status })
      })
      if (!res.ok) throw new Error()
      toast.success("Statut mis à jour")
      mutateCoachAttendance()
      mutateAudit()
    } catch (err) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsActionPending(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return <Badge className="bg-primary text-white font-black uppercase tracking-tight">Super Admin</Badge>
      case 'campus_manager': return <Badge variant="secondary" className="bg-success/20 text-success border-success/30 hover:bg-success/30">Campus Manager</Badge>
      default: return <Badge variant="outline">Coach</Badge>
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Administration" 
        description="Gestion de la plateforme, des utilisateurs et des formations."
      >
        <Button variant="outline" size="sm" onClick={() => {
          mutateStats()
          mutateFormations()
          mutateUsers()
          mutateAudit()
          mutateAnnouncements()
        }} className="gap-2">
          <RefreshCcw className="size-4" />
          <span>Actualiser</span>
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Apprenants Totaux</p>
                  <h3 className="text-3xl font-bold tracking-tight">{stats?.totalStudents || 0}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Users className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/20 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Présence Globale</p>
                  <h3 className="text-3xl font-bold tracking-tight">{stats?.globalPresenceRate || 0}%</h3>
                </div>
                <div className="p-3 bg-success/10 rounded-xl text-success">
                  <TrendingUp className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border-warning/20 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Coachs Actifs</p>
                  <h3 className="text-3xl font-bold tracking-tight">{stats?.rolesCount?.coach || 0}</h3>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl text-warning">
                  <ShieldCheck className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-info/5 border-info/20 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Formations</p>
                  <h3 className="text-3xl font-bold tracking-tight">{formations?.length || 0}</h3>
                </div>
                <div className="p-3 bg-info/10 rounded-xl text-info">
                  <BookOpen className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="formations" className="w-full">
          <TabsList className="bg-muted/50 p-1 border h-11">
            <TabsTrigger value="formations" className="gap-2 px-4">
              <BookOpen className="size-4" />
              <span>Formations</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 px-4">
              <Users className="size-4" />
              <span>Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2 px-4">
              <BarChart3 className="size-4" />
              <span>Journal d'audit</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2 px-4">
              <Megaphone className="size-4" />
              <span>Annonces</span>
            </TabsTrigger>
            <TabsTrigger value="staff-attendance" className="gap-2 px-4">
              <UserCheck className="size-4" />
              <span>Présence Staff</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent key="formations" value="formations" className="mt-6 border-none p-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <Card className="lg:col-span-1 shadow-sm">
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Gérez les formations et l'organisation.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => setIsFormationModalOpen(true)} 
                      className="w-full gap-2 font-bold h-12"
                    >
                      <Plus className="size-5" />
                      <span>Ajouter une Formation</span>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Les formations créées ici seront disponibles lors de l'inscription et de l'invitation des membres.
                    </p>
                  </CardContent>
                </Card>

                {/* Formations List */}
                <Card className="lg:col-span-2 shadow-sm">
                  <CardHeader>
                    <CardTitle>Liste des Formations</CardTitle>
                    <CardDescription>Gérez les filières actives dans l'organisation.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {!formations && (
                        <div className="col-span-2 space-y-2">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                      )}
                      {Array.isArray(formations) && formations.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-4 rounded-xl border bg-card group hover:border-primary/50 transition-all shadow-sm">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{f.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase bg-muted px-1.5 py-0.5 rounded w-fit mt-1">{f.value}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setFormationToDelete(f.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      {Array.isArray(formations) && formations.length === 0 && (
                        <div className="col-span-2 py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl italic">
                          Aucune formation enregistrée.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent key="users" value="users" className="mt-6 border-none p-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Gestion des Utilisateurs</CardTitle>
                    <CardDescription>Visualisez et modifiez les rôles des membres de l'équipe.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Membres de l'équipe</h3>
                      <Button 
                        onClick={() => setIsInviteModalOpen(true)} 
                        className="gap-2"
                      >
                        <Plus className="size-4" />
                        <span>Inviter un membre</span>
                      </Button>
                    </div>
                    <div className="rounded-xl border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Utilisateur</th>
                            <th className="px-4 py-3 text-left font-semibold">Formation</th>
                            <th className="px-4 py-3 text-left font-semibold">Rôle Actuel</th>
                            <th className="px-4 py-3 text-right font-semibold">Changer le rôle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {usersError && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-destructive bg-destructive/5 font-medium">
                                {usersError.info?.error || "Impossible de charger les utilisateurs"}
                              </td>
                            </tr>
                          )}
                          {!users && !usersError && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8">
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-full" />
                                </div>
                              </td>
                            </tr>
                          )}
                          {Array.isArray(users) && users.map((u: any) => (
                            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{u.full_name || "Sans nom"}</span>
                                    {u.role === 'super_admin' && u.formation && (
                                      <Badge variant="outline" className="text-[9px] h-4 px-1 bg-warning/10 text-warning border-warning/20">Coach</Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{u.email}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {u.formation_label ? (
                                  <Badge variant="secondary" className="font-normal text-[10px]">{u.formation_label}</Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Aucune</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                {getRoleBadge(u.role)}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {updatingUserId === u.id && <RefreshCcw className="size-3 animate-spin text-primary" />}
                                    <select 
                                      className="text-xs bg-background border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary h-8"
                                      value={u.role}
                                      disabled={updatingUserId === u.id}
                                      onChange={(e) => setUserToUpdate({ id: u.id, role: e.target.value })}
                                    >
                                      <option value="coach">Coach</option>
                                      <option value="campus_manager">Campus Manager</option>
                                      <option value="super_admin">Super Admin</option>
                                    </select>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                      onClick={() => setUserToDelete({ id: u.id, name: u.full_name || u.email })}
                                      title="Supprimer l'utilisateur"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent key="audit" value="audit" className="mt-6 border-none p-0 outline-none">
{/* ... slide confirm modals in at the end of content ... */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Journal d'audit</CardTitle>
                    <CardDescription>Actions récentes effectuées par l'administration.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.isArray(auditLogs) && auditLogs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:border-primary/20 transition-all">
                          <div className="p-2 bg-muted rounded-lg mt-1">
                            <ShieldCheck className="size-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sm tracking-tight">{log.actor_name}</span>
                              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {new Date(log.created_at).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80">{log.message}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{log.action}</Badge>
                              {log.target_type && (
                                <span className="text-[10px] text-muted-foreground">Cible : {log.target_type}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {Array.isArray(auditLogs) && auditLogs.length === 0 && (
                        <div className="py-20 text-center text-muted-foreground italic border-2 border-dashed rounded-xl">
                          Aucun log d'audit disponible.
                        </div>
                      )}
                      {!auditLogs && (
                        <div className="space-y-4">
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-20 w-full" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent key="announcements" value="announcements" className="mt-6 border-none p-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <Card className="lg:col-span-1 shadow-sm h-fit">
                  <CardHeader>
                    <CardTitle>Nouvelle Annonce</CardTitle>
                    <CardDescription>Publiez un message important.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold">Titre</label>
                        <input name="title" required className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: Maintenance prévue" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold">Message</label>
                        <textarea name="message" required className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]" placeholder="Détails de l'annonce..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold">Cible (Rôle)</label>
                        <select name="target_role" className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="all">Tout le monde</option>
                          <option value="coach">Coachs uniquement</option>
                          <option value="campus_manager">Campus Managers uniquement</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold">Cible (Campus)</label>
                          <select name="campus_id" className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="all">Tous les campus</option>
                            {Array.isArray(campuses) && campuses.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold">Cible (Cohorte)</label>
                          <select name="cohort_id" className="w-full text-sm bg-background border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="all">Toutes les cohortes</option>
                            {Array.isArray(cohorts) && cohorts.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Button type="submit" className="w-full gap-2 font-bold" disabled={isActionPending}>
                        {isActionPending ? <RefreshCcw className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                        <span>Publier</span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 shadow-sm">
                  <CardHeader>
                    <CardTitle>Annonces Actives</CardTitle>
                    <CardDescription>Messages actuellement visibles par l'équipe.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.isArray(announcements) && announcements.map((a: any) => (
                        <div key={a.id} className="p-4 rounded-xl border bg-card hover:border-primary/20 transition-all relative group">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-sm tracking-tight">{a.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] uppercase">{a.target_role === 'all' ? 'Tous' : a.target_role}</Badge>
                              {a.campuses && (
                                <Badge variant="outline" className="text-[9px] uppercase bg-blue-50 text-blue-700 border-blue-200">Campus: {a.campuses.name}</Badge>
                              )}
                              {a.cohorts && (
                                <Badge variant="outline" className="text-[9px] uppercase bg-purple-50 text-purple-700 border-purple-200">Cohorte: {a.cohorts.name}</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">{a.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Par {a.author_name} • {new Date(a.created_at).toLocaleDateString()}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setAnnouncementToDelete(a.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {Array.isArray(announcements) && announcements.length === 0 && (
                        <div className="py-20 text-center text-muted-foreground italic border-2 border-dashed rounded-xl">
                          Aucune annonce publiée.
                        </div>
                      )}
                      {!announcements && (
                        <div className="py-20 text-center text-muted-foreground animate-pulse border-2 border-dashed rounded-xl">
                          Chargement des annonces...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            <TabsContent key="staff-attendance" value="staff-attendance" className="mt-6 border-none p-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Présence des Formateurs</CardTitle>
                      <CardDescription>Marquez la présence de votre équipe pour le {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                       <Calendar className="size-4 text-muted-foreground" />
                       <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-background border rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                       />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.isArray(coachAttendance) && coachAttendance.map((coach: any) => (
                        <div key={coach.id} className="p-4 rounded-xl border bg-card flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {coach.full_name?.charAt(0) || 'C'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm tracking-tight">{coach.full_name}</span>
                              <span className="text-[10px] text-muted-foreground">{coach.role}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant={coach.status === 'present' ? 'default' : 'outline'}
                              className={`flex-1 text-[10px] h-7 ${coach.status === 'present' ? 'bg-success hover:bg-success/90' : ''}`}
                              onClick={() => handleCoachStatus(coach.id, 'present')}
                              disabled={isActionPending}
                            >
                              Présent
                            </Button>
                            <Button 
                              size="sm" 
                              variant={coach.status === 'retard' ? 'default' : 'outline'}
                              className={`flex-1 text-[10px] h-7 ${coach.status === 'retard' ? 'bg-warning hover:bg-warning/90 text-black' : ''}`}
                              onClick={() => handleCoachStatus(coach.id, 'retard')}
                              disabled={isActionPending}
                            >
                              Retard
                            </Button>
                            <Button 
                              size="sm" 
                              variant={coach.status === 'absent' ? 'default' : 'outline'}
                              className={`flex-1 text-[10px] h-7 ${coach.status === 'absent' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                              onClick={() => handleCoachStatus(coach.id, 'absent')}
                              disabled={isActionPending}
                            >
                              Absent
                            </Button>
                          </div>
                        </div>
                      ))}
                      {Array.isArray(coachAttendance) && coachAttendance.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl italic">
                          Aucun formateur trouvé dans votre organisation.
                        </div>
                      )}
                      {!coachAttendance && (
                        <div className="col-span-full py-12 text-center text-muted-foreground animate-pulse border-2 border-dashed rounded-xl">
                          Chargement du staff...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal 
        open={!!formationToDelete}
        onOpenChange={(open) => !open && setFormationToDelete(null)}
        onConfirm={handleDeleteFormation}
        loading={isActionPending}
        title="Supprimer la formation"
        description="Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible et pourrait affecter les utilisateurs rattachés."
      />

      <ConfirmModal 
        open={!!userToUpdate}
        onOpenChange={(open) => !open && setUserToUpdate(null)}
        onConfirm={handleUpdateRole}
        loading={isActionPending}
        variant="default"
        title="Changer le rôle"
        description="Confirmez-vous le changement de rôle pour cet utilisateur ?"
        confirmText="Changer le rôle"
      />

      <ConfirmModal 
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        loading={isActionPending}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer ${userToDelete?.name} ? Cette action est irréversible et supprimera tout accès à la plateforme.`}
      />

      <FormationForm 
        open={isFormationModalOpen}
        onOpenChange={setIsFormationModalOpen}
        onSubmit={handleAddFormation}
        loading={isAddingFormation}
      />

      <ConfirmModal 
        open={!!announcementToDelete}
        onOpenChange={(open) => !open && setAnnouncementToDelete(null)}
        onConfirm={handleDeleteAnnouncement}
        loading={isActionPending}
        title="Supprimer l'annonce"
        description="Cette annonce ne sera plus visible par les membres de l'équipe."
      />

      <InviteUserForm 
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onSubmit={handleInviteUser}
        loading={isInvitingUser}
        formations={formations}
      />
    </div>
  )
}
