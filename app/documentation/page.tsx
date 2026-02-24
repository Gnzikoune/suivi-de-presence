"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileUp,
  Database,
  HelpCircle,
  FileText,
  Settings,
  ShieldCheck,
  Zap,
  Code2,
  Table as TableIcon,
  Info,
  Clock,
  ArrowRightCircle,
  AlertCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DocumentationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <PageHeader
        title="Centre de Documentation"
        description="Maîtrisez l'intégralité de votre écosystème de suivi de présence Cloud."
      />

      <div className="p-4 md:p-6 pb-20 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="guide" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <TabsList className="grid grid-cols-3 h-12 w-full md:w-[600px] p-1 bg-muted/50 backdrop-blur-sm border">
              <TabsTrigger value="guide" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="size-4" />
                <span className="hidden sm:inline">Guide Utilisateur</span>
                <span className="sm:hidden">Guide</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Code2 className="size-4" />
                <span className="hidden sm:inline">Architecture Cloud</span>
                <span className="sm:hidden">Technique</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <HelpCircle className="size-4" />
                <span>FAQ</span>
              </TabsTrigger>
            </TabsList>
            
            {/* <Badge variant="outline" className="w-fit h-7 px-3 border-primary/30 text-primary bg-primary/5 font-medium animate-pulse">
              Version 2.0 (Airtable Cloud)
            </Badge> */}
          </div>

          <TabsContent value="guide" className="space-y-8 outline-none">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 md:grid-cols-3"
            >
              {/* Introduction Card */}
              <motion.div variants={itemVariants} className="md:col-span-3">
                <Card className="border-primary/10 bg-linear-to-br from-primary/5 to-transparent">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                      <Zap className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Bienvenue dans votre nouvel outil</CardTitle>
                      <CardDescription>Exploitez toute la puissance de la synchronisation en temps réel.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      Fini les pertes de données locales. Votre application est désormais connectée à <strong>Airtable</strong>, 
                      garantissant une persistance totale et un accès multi-utilisateurs. Ce guide vous explique comment 
                      gérer vos apprenants et vos sessions de présence efficacement.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Module Cards */}
              <ModuleSection 
                icon={LayoutDashboard} 
                title="Pilotage Dashboard" 
                color="text-blue-500" 
                bgColor="bg-blue-500/10"
                content="Consultez vos indicateurs clés en temps réel. Le taux moyen de présence est calculé dynamiquement sur la base des jours ouvrés de la formation."
              />
              <ModuleSection 
                icon={ClipboardCheck} 
                title="Saisie Instantanée" 
                color="text-green-500" 
                bgColor="bg-green-500/10"
                content="Pointez les présences matin ou après-midi. Les données sont envoyées immédiatement au Cloud. Pas besoin de bouton 'Save' manuel, sauf pour confirmation."
              />
              <ModuleSection 
                icon={Users} 
                title="Gestion Apprenants" 
                color="text-orange-500" 
                bgColor="bg-orange-500/10"
                content="Ajoutez, modifiez ou supprimez des apprenants. Chaque modification est reflétée instantanément sur tous les écrans du tableau de bord."
              />

              {/* Deep Dive Guide */}
              <motion.div variants={itemVariants} className="md:col-span-3 space-y-6 pt-6">
                <div className="flex items-center gap-2 px-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h3 className="text-xl font-bold tracking-tight">Utilisation Avancée</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-none w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">1</div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Import de Masse via Excel</h4>
                        <p className="text-sm text-muted-foreground">Utilisez notre modèle pour importer des dizaines d'apprenants en une seconde. Le système détecte automatiquement les noms, prénoms et classes.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-none w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">2</div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Exportation des Rapports</h4>
                        <p className="text-sm text-muted-foreground">Dans l'onglet Statistiques, générez des exports Excel détaillés pour vos rapports mensuels ou de fin de formation.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 p-6 flex flex-col justify-center gap-4">
                    <div className="flex items-start gap-4">
                      <Info className="size-5 text-primary mt-1" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Format Excel recommandé :</p>
                        <ul className="text-xs space-y-2 text-muted-foreground">
                          <li className="flex items-center gap-2"><CheckCircle2 className="size-3 text-green-500" /> Colonne "Nom"</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="size-3 text-green-500" /> Colonne "Prénom"</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="size-3 text-green-500" /> Colonne "Classe" (Matin/Apres-midi)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-8 outline-none border-none">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={itemVariants}>
                <Card className="overflow-hidden border-none shadow-md bg-card border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="size-5 text-purple-500" />
                      Schéma de la Base de Données Airtable
                    </CardTitle>
                    <CardDescription>Votre outil repose sur 3 tables essentielles synchronisées.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 border-t">
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                      <TableInfoCard 
                        name="Students" 
                        icon={Users}
                        fields={["firstName", "lastName", "classId", "createdAt"]}
                        desc="Stocke l'identité complète des apprenants."
                      />
                      <TableInfoCard 
                        name="Attendance" 
                        icon={ClipboardCheck}
                        fields={["studentId (Linked)", "date", "classId", "present"]}
                        desc="Historique quotidien granulé par session."
                      />
                      <TableInfoCard 
                        name="Settings" 
                        icon={Settings}
                        fields={["key", "value", "description"]}
                        desc="Pilote les dates de formation dynamiquement."
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-2">
                <motion.div variants={itemVariants}>
                  <Card className="h-full border-none shadow-sm bg-muted/40">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="size-5 text-green-600" />
                        Sécurité & Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-background border flex-none"><Clock className="size-4" /></div>
                        <div>
                          <p className="text-sm font-semibold">Mise en cache intelligente</p>
                          <p className="text-xs text-muted-foreground">L'utilisation de SWR permet une navigation instantanée avec synchronisation en arrière-plan sans rechargement.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-background border flex-none"><AlertCircle className="size-4" /></div>
                        <div>
                          <p className="text-sm font-semibold">Isolation Backend</p>
                          <p className="text-xs text-muted-foreground">Toutes les clés API Airtable sont stockées côté serveur dans des variables d'environnement sécurisées.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="h-full border-none shadow-sm bg-muted/40">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 border-l-4 border-primary pl-3">
                        Paramètres Dynamiques
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Vous pouvez modifier la <strong>Date de début</strong> et la <strong>Date de fin</strong> de la formation directement 
                        dans la table <code>Settings</code> d'Airtable.
                      </p>
                      <div className="p-3 bg-background rounded-xl border border-dashed border-primary/30 flex items-center justify-between group cursor-help">
                        <code>FORMATION_START</code>
                        <ArrowRightCircle className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <div className="p-3 bg-background rounded-xl border border-dashed border-primary/30 flex items-center justify-between group cursor-help">
                        <code>FORMATION_END</code>
                        <ArrowRightCircle className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="faq" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="bg-card border rounded-2xl px-6 transition-all hover:border-primary/50 shadow-sm">
                <AccordionTrigger className="hover:no-underline font-bold py-6 text-left">
                  Pourquoi utiliser Airtable au lieu d'une base locale ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  Airtable offre une interface visuelle pour administrer vos données même hors de l'application, 
                  facilite le travail en équipe et garantit une sauvegarde permanente sur le Cloud. Si vous changez 
                  de PC ou effacez vos cookies, vos données restent intactes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-card border rounded-2xl px-6 transition-all hover:border-primary/50 shadow-sm">
                <AccordionTrigger className="hover:no-underline font-bold py-6 text-left">
                  Comment corriger une erreur de pointage passée ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  Utilisez le sélecteur de date dans l'onglet <strong>Présence</strong>. Choisissez la date passée concernée, 
                  modifiez la sélection et cliquez sur <strong>Enregistrer</strong>. La nouvelle liste écrasera la précédente 
                  pour cette journée spécifique.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-card border rounded-2xl px-6 transition-all hover:border-primary/50 shadow-sm">
                <AccordionTrigger className="hover:no-underline font-bold py-6 text-left">
                  L'application fonctionne-t-elle hors connexion ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  <strong>Oui, absolument !</strong> L'application est nativement conçue pour fonctionner avec une connexion instable. 
                  Si vous perdez internet, vous pouvez continuer à saisir les présences. Elles seront stockées dans une 
                  <strong> file d'attente locale sécurisée</strong> et synchronisées automatiquement dès que la connexion est rétablie.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ModuleSection({ icon: Icon, title, content, color, bgColor }: { 
  icon: any, title: string, content: string, color: string, bgColor: string 
}) {
  return (
    <motion.div variants={itemVariants} className="h-full">
      <Card className="h-full hover:shadow-lg transition-all group overflow-hidden border-none shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className={cn("p-3 rounded-xl w-fit mb-2 transition-transform group-hover:scale-110", bgColor, color)}>
            <Icon className="size-6" />
          </div>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TableInfoCard({ name, icon: Icon, fields, desc }: { 
  name: string, icon: any, fields: string[], desc: string 
}) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted border">
          <Icon className="size-4" />
        </div>
        <span className="font-bold text-lg">{name}</span>
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
      <div className="space-y-1.5 pt-2">
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Champs Clés</p>
        <div className="flex flex-wrap gap-1.5">
          {fields.map(f => (
            <Badge key={f} variant="secondary" className="text-[10px] px-1.5 h-5 font-mono bg-muted/50 border-none">
              {f}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
