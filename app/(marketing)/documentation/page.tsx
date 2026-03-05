"use client"

import { motion, Variants } from "framer-motion"
import { 
  Zap, 
  LayoutDashboard, 
  ClipboardCheck,
  Users,
  BookOpen,
  Code2,
  HelpCircle,
  Database,
  Clock,
  AlertCircle,
  Info,
  ShieldCheck
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

export default function DocumentationPage() {
  return (
    <div className="pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight">Centre de Documentation</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Maîtrisez l'intégralité de votre écosystème de suivi de présence.
          </p>
        </motion.div>

        <Tabs defaultValue="guide" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-center gap-4 mb-8">
            <TabsList className="grid grid-cols-3 h-11 w-full md:w-[520px] p-1 bg-muted/50 backdrop-blur-sm border rounded-xl text-sm">
              <TabsTrigger value="guide" className="gap-2 rounded-xl transition-all data-[state=active]:bg-background data-[state=active]:shadow-md">
                <BookOpen className="size-4" />
                <span className="hidden sm:inline">Guide Utilisateur</span>
                <span className="sm:hidden">Guide</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="gap-2 rounded-xl transition-all data-[state=active]:bg-background data-[state=active]:shadow-md">
                <Code2 className="size-4" />
                <span className="hidden sm:inline">Architecture Cloud</span>
                <span className="sm:hidden">Technique</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2 rounded-xl transition-all data-[state=active]:bg-background data-[state=active]:shadow-md">
                <HelpCircle className="size-4" />
                <span>FAQ</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="guide" className="space-y-8 outline-none">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-8 md:grid-cols-3"
            >
              {/* Introduction Card */}
              <motion.div variants={itemVariants} className="md:col-span-3">
                <Card className="border-primary/10 bg-linear-to-br from-primary/5 to-transparent shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-3 p-6">
                    <div className="p-3 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                      <Zap className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg md:text-xl">Espace de Gestion Intelligent</CardTitle>
                      <p className="text-sm text-muted-foreground">Une plateforme unifiée pour Coachs, Campus Managers et Admins.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      L'application est conçue pour s'adapter à votre rôle. Que vous soyez <strong>Coach</strong> gérant une cohorte, 
                      <strong>Campus Manager</strong> supervisant plusieurs formations, ou <strong>Super Admin</strong> pilotant l'écosystème, 
                      votre espace est optimisé et sécurisé par <strong>Supabase Cloud</strong>.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Module Cards */}
              <ModuleCard 
                icon={LayoutDashboard} 
                title="Pilotage Dashboard" 
                color="text-blue-500" 
                bgColor="bg-blue-500/10"
                content="Visualisez vos statistiques de présence. Le système calcule automatiquement l'absentéisme et la progression de votre formation."
              />
              <ModuleCard 
                icon={ClipboardCheck} 
                title="Saisie Intuitive" 
                color="text-green-500" 
                bgColor="bg-green-500/10"
                content="Pointez les présences sur mobile ou tablette. Enregistrez vos sessions en un clic, avec synchronisation immédiate sur le Cloud."
              />
              <ModuleCard 
                icon={Users} 
                title="Gestion des Apprenants" 
                color="text-orange-500" 
                bgColor="bg-orange-500/10"
                content="Organisez vos classes (Matin / Après-midi). Importez vos listes Excel pour gagner du temps lors de la configuration initiale."
              />

              {/* Deep Dive Guide */}
              <motion.div variants={itemVariants} className="md:col-span-3 space-y-6 pt-6 text-center md:text-left">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-muted border border-border/50">
                  <div className="size-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="text-base font-bold tracking-tight">Focus : Responsive & Performance</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex gap-4 group">
                      <div className="flex-none w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110">1</div>
                      <div className="space-y-1 text-left">
                        <h4 className="font-bold text-sm md:text-base">Expérience Mobile First</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">L'interface s'adapte dynamiquement. Les tableaux et graphiques sont optimisés pour smartphone pour une utilisation fluide en salle de cours.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 group">
                      <div className="flex-none w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110">2</div>
                      <div className="space-y-1 text-left">
                        <h4 className="font-bold text-sm md:text-base">Sauvegarde Automatique</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Vos paramètres (Nom de formation, dates, organisation) sont sauvegardés en base de données SQL dès que vous les modifiez.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-5 flex flex-col justify-center gap-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Info className="size-4 text-primary mt-0.5 shrink-0" />
                      <div className="space-y-1 text-left">
                        <p className="font-bold text-sm">Pourquoi Outfit ?</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
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

          <TabsContent value="technical" className="space-y-6 outline-none">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <Card className="overflow-hidden border-none shadow-md bg-card border-l-4 border-l-purple-500 rounded-2xl">
                  <CardHeader className="p-6">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Database className="size-5 text-purple-500" />
                      Architecture Cloud & Isolation (RLS)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Vos données sont protégées par Row Level Security (RLS).</p>
                  </CardHeader>
                  <CardContent className="p-0 border-t">
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-border/50">
                      <TableInfoItem 
                        name="profiles" 
                        icon={ShieldCheck}
                        fields={["id", "role", "full_name", "formation", "orga_name"]}
                        desc="Profils unifiés gérant les droits d'accès pour Coachs, Campus Managers et Admins."
                      />
                      <TableInfoItem 
                        name="students" 
                        icon={Users}
                        fields={["firstName", "lastName", "formation"]}
                        desc="Gestion des apprenants avec segmentation par cohorte dynamique."
                      />
                      <TableInfoItem 
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
                  <Card className="h-full border-none shadow-sm bg-muted/40 rounded-2xl">
                    <CardHeader className="p-5">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="size-4 text-green-600" />
                        Synchronisation & Offline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 space-y-4">
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-background border flex-none"><Clock className="size-4" /></div>
                        <div>
                          <p className="font-bold text-sm">Queue de Synchronisation</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">En cas de coupure réseau, vos actions sont mises en attente et renvoyées automatiquement une fois en ligne.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-background border flex-none"><AlertCircle className="size-4" /></div>
                        <div>
                          <p className="font-bold text-sm">Intégrité des données</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">Supabase garantit qu'aucune donnée ne peut être accédée par un autre utilisateur sans authentification valide.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="h-full border-none shadow-sm bg-muted/40 rounded-2xl">
                    <CardHeader className="p-5">
                      <CardTitle className="text-base flex items-center gap-2 border-l-4 border-primary pl-3">
                        Paramètres Applicatifs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        L'outil est hautement configurable via l'espace de gestion, sans nécessiter de modifications techniques.
                      </p>
                      <div className="p-3 bg-background rounded-xl border border-dashed border-primary/30 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">NOM_FORMATION</span>
                        <Badge variant="outline" className="text-[10px] opacity-70 bg-primary/5">Synchro DB</Badge>
                      </div>
                      <div className="p-3 bg-background rounded-xl border border-dashed border-primary/30 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">DATES_LIMITES</span>
                        <Badge variant="outline" className="text-[10px] opacity-70 bg-primary/5">Synchro DB</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="faq" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <FAQItem 
                value="roles" 
                question="Quels sont les différents rôles et leurs permissions ?"
                answer={
                  <div className="space-y-4">
                    <p>L'application gère trois niveaux d'accès distincts :</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Coach</strong> : Peut gérer ses apprenants, faire l'appel et voir ses propres statistiques.</li>
                      <li><strong>Campus Manager</strong> : Possède une vue d'ensemble sur toutes les formations de son organisation pour un pilotage global.</li>
                      <li><strong>Super Admin</strong> : Contrôle total (gestion des utilisateurs, création de formations, audit système).</li>
                    </ul>
                  </div>
                }
              />
              <FAQItem 
                value="security" 
                question="Mes données sont-elles vraiment sécurisées et privées ?"
                answer="Oui, absolument. Vos données sont stockées sur l'infrastructure Cloud de Supabase, isolées par des politiques de sécurité au niveau des lignes (Row Level Security). Cela signifie qu'un Coach ne peut physiquement pas voir les données d'un autre Coach. Vos listes d'élèves et vos historiques sont strictement confidentiels."
              />
              <FAQItem 
                value="sync" 
                question="Que se passe-t-il si je change d'appareil ou travaille en déplacement ?"
                answer="L'application est 100% basée sur le Cloud. Vos données sont synchronisées en temps réel. Si vous changez de téléphone, de tablette ou d'ordinateur, il vous suffit de vous connecter pour retrouver instantanément toute votre configuration, vos élèves et vos pointages."
              />
              <FAQItem 
                value="offline" 
                question="L'application fonctionne-t-elle sans connexion internet ?"
                answer="Oui, le système dispose d'un mécanisme de cache intelligent. Vous pouvez consulter vos listes même hors-ligne. Pour l'appel (saisie de présence), une connexion est requise pour garantir que les données sont immédiatement sauvegardées et synchronisées pour les audits et rapports."
              />
              <FAQItem 
                value="export" 
                question="Puis-je exporter mes données de présence vers Excel ?"
                answer="Cette fonctionnalité est native ! Dans l'espace de gestion, vous pouvez générer des rapports et exporter vos listes au format Excel (.xlsx) pour vos besoins administratifs ou pour un archivage externe."
              />
              <FAQItem 
                value="mobile" 
                question="Existe-t-il une application mobile à télécharger ?"
                answer="L'application est une Web App Responsive performante. Elle ne nécessite pas d'installation via l'App Store. Vous pouvez simplement l'ajouter à l'écran d'accueil de votre smartphone ou tablette pour l'utiliser comme une application native."
              />
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ModuleCard({ icon: Icon, title, content, color, bgColor }: { 
  icon: any, title: string, content: string, color: string, bgColor: string 
}) {
  return (
    <motion.div variants={itemVariants} className="h-full">
      <Card className="h-full hover:shadow-md transition-all group overflow-hidden border border-border/50 shadow-sm bg-background rounded-2xl">
        <div className="p-6">
          <div className={cn("size-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", bgColor, color)}>
            <Icon className="size-5" />
          </div>
          <h3 className="text-base font-bold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        </div>
      </Card>
    </motion.div>
  )
}

function TableInfoItem({ name, icon: Icon, fields, desc }: { 
  name: string, icon: any, fields: string[], desc: string 
}) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-muted border border-border/50">
          <Icon className="size-4" />
        </div>
        <span className="font-bold text-base">{name}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      <div className="space-y-2 pt-2">
        <p className="text-[10px] uppercase font-black text-primary tracking-widest pl-1">Champs Clés</p>
        <div className="flex flex-wrap gap-1.5">
          {fields.map(f => (
            <Badge key={f} variant="secondary" className="text-[10px] px-2 py-0.5 font-mono bg-muted/80 border-none rounded-md">
              {f}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

function FAQItem({ value, question, answer }: { value: string, question: string, answer: React.ReactNode }) {
  return (
    <AccordionItem value={value} className="bg-card/50 backdrop-blur-sm border rounded-2xl px-5 transition-all hover:border-primary/50 shadow-sm overflow-hidden mb-3">
      <AccordionTrigger className="hover:no-underline font-bold py-4 text-left text-sm md:text-base">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
        {answer}
      </AccordionContent>
    </AccordionItem>
  )
}
