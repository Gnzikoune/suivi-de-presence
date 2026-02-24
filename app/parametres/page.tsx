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
  saveSetting
} from "@/lib/api-service"
import { FORMATION_START, FORMATION_END } from "@/lib/constants"
import { motion, AnimatePresence } from "framer-motion"

export default function ParametresPage() {
  const { data: settings } = useSWR("settings", fetchSettings)
  
  // Local form states for settings
  const [formStart, setFormStart] = useState("")
  const [formEnd, setFormEnd] = useState("")
  const [savingSettings, setSavingSettings] = useState(false)

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
    setSavingSettings(true)
    try {
      await saveSetting("FORMATION_START", formStart, "Date de début de formation")
      await saveSetting("FORMATION_END", formEnd, "Date de fin de formation")
      await mutate("settings")
      toast.success("Paramètres mis à jour sur le Cloud")
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde des paramètres")
    } finally {
      setSavingSettings(false)
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
          <TabsList className="grid grid-cols-1 h-12 w-full md:w-[200px] p-1 bg-muted/50 backdrop-blur-sm border">
            <TabsTrigger 
              value="config" 
              className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Settings className="size-4" />
              <span>Général</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="config">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
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
                    <Button onClick={handleUpdateSettings} disabled={savingSettings} className="ml-auto gap-2">
                      {savingSettings ? <RefreshCcw className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Appliquer les modifications
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
                    <h4 className="font-bold">Support Airtable</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ces paramètres sont stockés dans la table <code>Settings</code>. Toute modification ici sera visible par tous les administrateurs.
                    </p>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}
