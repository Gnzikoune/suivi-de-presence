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
        description="Maîtrisez l'intégralité de votre écosystème de suivi de présence Supabase Cloud."
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
            
            <Badge variant="outline" className="w-fit h-7 px-3 border-primary/30 text-primary bg-primary/5 font-medium">
              Système Multi-Rôles v4.5
            </Badge>
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
                <Card className="border-primary/10 bg-linear-to-br from-primary/5 to-transparent shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                      <Zap className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Espace de Gestion Intelligent</CardTitle>
                      <CardDescription>Une plateforme unifiée pour Coachs, Campus Managers et Admins.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      L'application est conçue pour s'adapter à votre rôle. Que vous soyez <strong>Coach</strong> gérant une cohorte, 
                      <strong>Campus Manager</strong> supervisant plusieurs formations, ou <strong>Super Admin</strong> pilotant l'écosystème, 
                      votre espace est optimisé et sécurisé par <strong>Supabase Cloud</strong>.
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
                content="Visualisez vos statistiques de présence. Le système calcule automatiquement l'absentéisme et la progression de votre formation."
              />
              <ModuleSection 
                icon={ClipboardCheck} 
                title="Saisie Intuitive" 
                color="text-green-500" 
                bgColor="bg-green-500/10"
                content="Pointez les présences sur mobile ou tablette. Enregistrez vos sessions en un clic, avec synchronisation immédiate sur le Cloud."
              />
              <ModuleSection 
                icon={Users} 
                title="Gestion des Apprenants" 
                color="text-orange-500" 
                bgColor="bg-orange-500/10"
                content="Organisez vos classes (Matin / Après-midi). Importez vos listes Excel pour gagner du temps lors de la configuration initiale."
              />

              {/* Deep Dive Guide */}
              <motion.div variants={itemVariants} className="md:col-span-3 space-y-6 pt-6">
                <div className="flex items-center gap-2 px-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h3 className="text-xl font-bold tracking-tight">Focus : Responsive & Performance</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-none w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">1</div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Expérience Mobile First</h4>
                        <p className="text-sm text-muted-foreground">L'interface s'adapte dynamiquement. Les tableaux et graphiques sont optimisés pour smartphone pour une utilisation fluide en salle de cours.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-none w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">2</div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Sauvegarde Automatique</h4>
                        <p className="text-sm text-muted-foreground">Vos paramètres (Nom de formation, dates, organisation) sont sauvegardés en base de données SQL dès que vous les modifiez.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-card p-6 flex flex-col justify-center gap-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <Info className="size-5 text-primary mt-1" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Pourquoi Outfit ?</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Nous avons choisi la police <strong>Outfit</strong> pour son esthétique géométrique moderne, 
                          améliorant la clarté des tableaux de bord et renforçant l'aspect institutionnel de l'outil.
                        </p>
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
                      Architecture Cloud & Isolation (RLS)
                    </CardTitle>
                    <CardDescription>Vos données sont protégées par Row Level Security (RLS).</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 border-t">
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                      <TableInfoCard 
                        name="profiles" 
                        icon={ShieldCheck}
                        fields={["id", "role", "full_name", "formation", "orga_name"]}
                        desc="Profils unifiés gérant les droits d'accès pour Coachs, Campus Managers et Admins."
                      />
                      <TableInfoCard 
                        name="students" 
                        icon={Users}
                        fields={["firstName", "lastName", "formation"]}
                        desc="Gestion des apprenants avec segmentation par cohorte dynamique."
                      />
                      <TableInfoCard 
                        name="formations" 
                        icon={BookOpen}
                        fields={["label", "value"]}
                        desc="Référentiel central des cohortes disponibles dans l'écosystème."
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-2">
                <motion.div variants={itemVariants}>
                  <Card className="h-full border-none shadow-sm bg-muted/40 font-sans">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="size-5 text-green-600" />
                        Synchronisation & Offline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-background border flex-none"><Clock className="size-4" /></div>
                        <div>
                          <p className="text-sm font-semibold">Queue de Synchronisation</p>
                          <p className="text-xs text-muted-foreground">En cas de coupure réseau, vos actions sont mises en attente et renvoyées automatiquement une fois en ligne.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-background border flex-none"><AlertCircle className="size-4" /></div>
                        <div>
                          <p className="text-sm font-semibold">Intégrité des données</p>
                          <p className="text-xs text-muted-foreground">Supabase garantit qu'aucune donnée ne peut être accédée par un autre utilisateur sans authentification valide.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="h-full border-none shadow-sm bg-muted/40">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 border-l-4 border-primary pl-3">
                        Paramètres Applicatifs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        L'onglet <strong>Paramètres</strong> permet de configurer votre environnement sans toucher au code.
                      </p>
                      <div className="p-3 bg-background rounded-xl border border-dashed border-primary/30 flex items-center justify-between group cursor-default">
                        <span className="text-xs font-mono">NOM_FORMATION</span>
                        <Badge variant="outline" className="text-[10px] opacity-70">Synchro DB</Badge>
                      </div>
                      <div className="p-3 bg-background rounded-xl border border-dashed border-primary/30 flex items-center justify-between group cursor-default">
                        <span className="text-xs font-mono">DATES_LIMITES</span>
                        <Badge variant="outline" className="text-[10px] opacity-70">Synchro DB</Badge>
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
                  Mes données sont-elles vraiment sécurisées ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  <strong>Oui.</strong> Nous utilisons l'infrastructure Cloud de Supabase certifiée SOC2. 
                  Chaque donnée est protégée par des politiques **RLS (Row Level Security)**. 
                  Un Coach ne voit que ses élèves, tandis qu'un Campus Manager possède une visibilité étendue sur son campus.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-card border rounded-2xl px-6 transition-all hover:border-primary/50 shadow-sm">
                <AccordionTrigger className="hover:no-underline font-bold py-6 text-left">
                  Que se passe-t-il si je change de téléphone/ordinateur ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  Il vous suffit de vous connecter avec vos identifiants sur le nouvel appareil. 
                  Toutes vos données (paramètres, élèves, historiques) seront immédiatement synchronisées 
                  car elles résident sur le Cloud, et non plus uniquement en local.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-card border rounded-2xl px-6 transition-all hover:border-primary/50 shadow-sm">
                <AccordionTrigger className="hover:no-underline font-bold py-6 text-left">
                  Les paramètres sont-ils sauvegardés en base de données ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  <strong>Absolument.</strong> Lorsque vous modifiez le nom de la formation ou les dates dans l'onglet 
                  Paramètres, une requête <code>UPSERT</code> est envoyée à la table <code>settings</code> de Supabase. 
                  Cela garantit que votre configuration vous suit partout.
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
