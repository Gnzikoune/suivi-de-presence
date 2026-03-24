"use client"

import { useState, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import {
  Calendar as CalendarIcon,
  Settings,
  RefreshCcw,
  Save,
  AlertTriangle,
  User as UserIcon,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  fetchSettings,
  saveSetting,
  fetchProfile,
  updateProfile
} from "@/lib/api-service"
import { FORMATION_START, FORMATION_END } from "@/lib/constants"
import { motion, AnimatePresence } from "framer-motion"
import { ConfirmModal } from "@/components/confirm-modal"
import { LogoUpload } from "@/components/logo-upload"

export default function ParametresPage() {
  const { data: settings } = useSWR("settings", fetchSettings)
  
  // Local form states for settings
  const [formStart, setFormStart] = useState("")
  const [formEnd, setFormEnd] = useState("")
  const [formationName, setFormationName] = useState("")
  const [orgaName, setOrgaName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const { data: formations } = useSWR("/api/formations", async (url) => {
    const res = await fetch(url)
    if (!res.ok) return []
    return res.json()
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Profile states
  const { data: profile } = useSWR("profile", fetchProfile)
  const [fullName, setFullName] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  
  // Confirmation state
  const [showSettingsConfirm, setShowSettingsConfirm] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "")
      setFormationName(profile.formation || "")
      setOrgaName(profile.orga_name || "")
      setLogoUrl(profile.logo_url || "")
    }
  }, [profile])

  useEffect(() => {
    if (settings) {
      setFormStart(settings.FORMATION_START || FORMATION_START)
      setFormEnd(settings.FORMATION_END || FORMATION_END)
    } else {
      setFormStart(FORMATION_START)
      setFormEnd(FORMATION_END)
    }
  }, [settings])

  const handleUpdateSettings = async () => {
    setShowSettingsConfirm(false)
    setSavingSettings(true)
    try {
      await saveSetting("FORMATION_START", formStart, "Date de début de formation")
      await saveSetting("FORMATION_END", formEnd, "Date de fin de formation")
      
      // Update the profile table for formation and organization (Master Data)
      await updateProfile({ 
        formation: formationName, 
        orga_name: orgaName,
        logo_url: logoUrl
      })
      
      await mutate("settings")
      await mutate("profile")
      toast.success("Paramètres système mis à jour")
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    try {
      await updateProfile({ full_name: fullName })
      await mutate("profile")
      toast.success("Profil personnel mis à jour")
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Administration & Système"
        description="Configurez votre environnement de travail et gérez vos paramètres Cloud."
      />

      <div className="p-4 md:p-6 pb-20 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="config" className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 h-12 w-full md:w-[400px] p-1 bg-muted/50 backdrop-blur-sm border">
            <TabsTrigger 
              value="config" 
              className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Settings className="size-4" />
              <span>Général</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <UserIcon className="size-4" />
              <span>Mon Profil</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="config" key="config">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="size-5 text-primary" />
                      Identité de la Formation
                    </CardTitle>
                    <CardDescription>
                      Personnalisez le nom et l'organisation affichés dans l'application.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="formationName">Votre Formation</Label>
                        <select 
                          id="formationName" 
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formationName} 
                          onChange={(e) => setFormationName(e.target.value)} 
                        >
                          <option value="">(Aucune formation)</option>
                          {Array.isArray(formations) && formations.map((f: any) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgaName">Nom de l'Organisation</Label>
                        <Input 
                          id="orgaName" 
                          placeholder="Ex: Digital Academy" 
                          value={orgaName} 
                          onChange={(e) => setOrgaName(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="divider h-px bg-border my-6" />

                    <LogoUpload 
                      currentLogoUrl={logoUrl} 
                      onUploadSuccess={setLogoUrl} 
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="size-5 text-primary" />
                      Période de Formation
                    </CardTitle>
                    <CardDescription>
                      Ces dates impactent directement le calcul d'assiduité sur le tableau de bord.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="start">Date de début</Label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input 
                            id="start" 
                            type="date" 
                            className="pl-9" 
                            value={formStart} 
                            onChange={(e) => setFormStart(e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end">Date de fin</Label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input 
                            id="end" 
                            type="date" 
                            className="pl-9" 
                            value={formEnd} 
                            onChange={(e) => setFormEnd(e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t py-4">
                    <Button onClick={() => setShowSettingsConfirm(true)} disabled={savingSettings} className="ml-auto gap-2">
                      {savingSettings ? <RefreshCcw className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Sauvegarder les paramètres
                    </Button>
                  </CardFooter>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-primary/5 space-y-2">
                    <h4 className="font-bold flex items-center gap-2 text-primary">
                      <AlertTriangle className="size-4" />
                      Note importante
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      La modification de ces dates recalculera instantanément le "Taux d'assiduité" sur la page d'accueil pour tous les apprenants.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                    <h4 className="font-bold">Espace Coach Isolé</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Vos données et paramètres sont strictement personnels. Un autre formateur ne verra pas vos informations.
                    </p>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="profile" key="profile">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="size-5 text-primary" />
                      Informations Personnelles
                    </CardTitle>
                    <CardDescription>
                      Gérez vos informations de compte qui seront affichées dans l'application.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nom Complet</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input 
                            id="fullName" 
                            placeholder="Votre nom complet" 
                            className="pl-9"
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Adresse Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                          <Input 
                            value={profile?.email || ""} 
                            readOnly 
                            className="pl-9 bg-muted/30 cursor-not-allowed opacity-70"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground px-1">
                          L'email ne peut pas être modifié pour des raisons de sécurité.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rôle du Compte</Label>
                      <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/10 w-fit">
                        <ShieldCheck className="size-4 text-primary" />
                        <span className="text-sm font-bold uppercase tracking-wider">
                          {profile?.role === 'super_admin' ? 'Super Administrateur' : 
                           profile?.role === 'campus_manager' ? 'Campus Manager' : 'Coach Formateur'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t py-4">
                    <Button onClick={handleUpdateProfile} disabled={savingProfile} className="ml-auto gap-2">
                      {savingProfile ? <RefreshCcw className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Mettre à jour mon profil
                    </Button>
                  </CardFooter>
                </Card>

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                  <UserIcon className="size-5 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Pourquoi compléter votre nom ?</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Votre nom complet sera bientôt utilisé pour la génération automatique de vos rapports de présence
                      et pour personnaliser votre interface de coach.
                    </p>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
      
      <ConfirmModal 
        open={showSettingsConfirm}
        onOpenChange={setShowSettingsConfirm}
        onConfirm={handleUpdateSettings}
        loading={savingSettings}
        variant="default"
        title="Mettre à jour les paramètres ?"
        description="Le changement des dates de formation impactera le calcul d'assiduité de tous les apprenants. Confirmez-vous cette action ?"
        confirmText="Confirmer la mise à jour"
      />
    </div>
  )
}
