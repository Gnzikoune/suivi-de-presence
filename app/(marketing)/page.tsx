"use client"

import { Button } from "@/components/ui/button"
import { motion, Variants } from "framer-motion"
import { 
  Users, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  LayoutDashboard, 
  ClipboardCheck,
  Globe,
  Clock
} from "lucide-react"
import Link from "next/link"
import NextImage from "next/image"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

export default function MarketingHomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-28 pb-12 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Floating Background Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[10%] text-primary/10"
          >
            <Users className="size-16 md:size-24" />
          </motion.div>
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -10, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[20%] right-[15%] text-primary/10"
          >
            <ClipboardCheck className="size-12 md:size-20" />
          </motion.div>
          <motion.div 
            animate={{ 
              x: [0, 15, 0],
              y: [0, -15, 0]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-[25%] left-[20%] text-primary/10"
          >
            <Clock className="size-10 md:size-16" />
          </motion.div>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[30%] right-[25%] text-primary/10"
          >
            <ShieldCheck className="size-14 md:size-28" />
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 bg-linear-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
              Professionnalisez <br className="hidden md:block" /> le suivi de formation
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground/80 mb-8 leading-relaxed max-w-2xl mx-auto">
              L'écosystème complet pour centraliser vos appels, automatiser vos rapports et moderniser l'expérience pédagogique.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 text-base font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 group transition-all hover:scale-105 active:scale-95">
                <Link href="/login" className="flex items-center gap-2">
                  C'est parti <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="w-full sm:w-auto h-12 px-8 text-base font-bold rounded-2xl border border-primary/10 hover:bg-primary/5 transition-all">
                <Link href="/documentation">Lire la doc</Link>
              </Button>
            </div>
          </motion.div>

          {/* Real Dashboard Screenshot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
              {/* Browser-like top bar */}
              <div className="bg-muted/80 backdrop-blur-sm border-b border-border/50 h-9 flex items-center px-4 gap-2">
                <div className="size-2.5 rounded-full bg-red-400/60" />
                <div className="size-2.5 rounded-full bg-yellow-400/60" />
                <div className="size-2.5 rounded-full bg-green-400/60" />
                <div className="mx-auto flex items-center gap-2 px-4 py-1 rounded-md bg-background/50 border border-border/30 text-xs text-muted-foreground font-mono">
                  suivi-presence.app/dashboard
                </div>
              </div>
              <NextImage
                src="/dashboard-preview.png"
                alt="Tableau de bord Suivi de Présence"
                width={1200}
                height={750}
                className="w-full h-auto object-cover"
                priority
              />
              {/* Subtle overlay gradient at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background/20 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black mb-3">Comment ça marche ?</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Démarrez en quelques minutes, sans formation requise.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border/60" />
            <HowItWorksStep
              number={1}
              icon={Users}
              title="Créez votre espace"
              description="Connectez-vous, configurez votre organisation et importez vos listes d'apprenants en quelques clics."
            />
            <HowItWorksStep
              number={2}
              icon={ClipboardCheck}
              title="Faites l'appel"
              description="Depuis n'importe quel appareil, saisissez les présences du jour en temps réel, session par session."
            />
            <HowItWorksStep
              number={3}
              icon={BarChart3}
              title="Analysez & Exportez"
              description="Visualisez les taux de présence, détectez l'absentéisme et générez vos rapports Excel pour vos audits."
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-3">Conçu pour l'excellence pédagogique</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Oubliez la paperasse. Concentrez-vous sur ce qui compte vraiment : la réussite de vos apprenants.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <FeatureCard 
              icon={LayoutDashboard}
              title="Centralisation Totale"
              description="Gérez toutes vos cohortes, promos et formateurs sur un tableau de bord unique et intuitif."
            />
            <FeatureCard 
              icon={ClipboardCheck}
              title="Saisie Instantanée"
              description="Appel numérique optimisé pour mobile et tablette. Synchronisation en temps réel sur le Cloud."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Analyses Avancées"
              description="Visualisez les taux de présence et d'absentéisme en temps réel pour un pilotage proactif."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Sécurité Bancaire"
              description="Données isolées par RLS (Row Level Security) garantissant une confidentialité absolue."
            />
            <FeatureCard 
              icon={Zap}
              title="Offline Ready"
              description="Ne craignez plus les coupures réseau. Vos saisies sont sauvegardées localement et synchronisées."
            />
            <FeatureCard 
              icon={CheckCircle2}
              title="Export Administratif"
              description="Générez vos listes d'émargement et rapports Excel en un clic pour vos audits."
            />
          </motion.div>
        </div>
      </section>

      {/* Role Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-black mb-6 leading-tight">
                Une interface adaptée à votre rôle
              </h2>
              <div className="space-y-6">
                <RoleItem 
                  title="Coach & Intervenant" 
                  description="Faites l'appel en quelques secondes, gérez vos listes et suivez votre cohorte." 
                />
                <RoleItem 
                  title="Campus Manager" 
                  description="Supervisez l'intégralité du campus, analysez les tendances globales et pilotez la performance." 
                />
                <RoleItem 
                  title="Super Administrateur" 
                  description="Contrôlez les accès, gérez les formations et assurez l'audit complet du système." 
                />
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10"
            >
              <div className="aspect-square relative flex items-center justify-center w-full h-100">
                 <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
                 <Users className="size-48 text-primary/40 relative z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <motion.div 
      variants={itemVariants}
      className="p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
    >
      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="size-5" />
      </div>
      <h3 className="text-base font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  )
}

function RoleItem({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="mt-1 shrink-0">
        <div className="size-5 rounded-full border-2 border-primary flex items-center justify-center transition-transform group-hover:scale-110">
          <div className="size-2 rounded-full bg-primary" />
        </div>
      </div>
      <div className="space-y-1 text-left">
        <h4 className="font-bold text-base md:text-lg">{title}</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function HowItWorksStep({ number, icon: Icon, title, description }: {
  number: number, icon: any, title: string, description: string
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center text-center group"
    >
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
          <Icon className="size-7" />
        </div>
        <div className="absolute -top-2 -right-2 size-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shadow-md">
          {number}
        </div>
      </div>
      <h3 className="font-bold text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">{description}</p>
    </motion.div>
  )
}
