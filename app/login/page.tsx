"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, ArrowRight, ChevronLeft, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { saveSetting } from "@/lib/api-service"
import { getErrorMessage } from "@/lib/error-utils"
import useSWR from "swr"

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formationName, setFormationName] = useState("")
  const [orgaName, setOrgaName] = useState("")
  const [selectedRole, setSelectedRole] = useState("coach")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (resetError) {
        setError(getErrorMessage(resetError))
      } else {
        setSuccess("Un e-mail de réinitialisation a été envoyé à votre adresse.")
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi de l'e-mail.")
    } finally {
      setLoading(false)
    }
  }

  const { data: formations } = useSWR("/api/formations", async (url) => {
    const res = await fetch(url)
    if (!res.ok) return []
    return res.json()
  })

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isForgotPassword) {
      return handlePasswordReset(e)
    }
    setError(null)
    setSuccess(null)

    // Client-side validation
    if (!email.includes("@")) {
      setError("Veuillez entrer une adresse e-mail valide.")
      return
    }

    if (isSignUp && step === 1) {
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.")
        return
      }
      setStep(2)
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: selectedRole,
              formation: formationName,
              formation_name: formationName,
              orga_name: orgaName,
            }
          }
        })
        
        if (authError) {
          setError(getErrorMessage(authError))
        } else {
          setSuccess("Compte créé ! Veuillez vérifier vos e-mails pour confirmer votre inscription.")
          setIsSignUp(false)
          setStep(1)
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          setError(getErrorMessage(authError))
        } else {
          router.push("/")
          router.refresh()
        }
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue.")
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setIsForgotPassword(false)
    setStep(1)
    setError(null)
    setSuccess(null)
  }

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword)
    setIsSignUp(false)
    setStep(1)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen w-full flex bg-background overflow-hidden">
      {/* Left Side: Decorative Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-60">
          <Image 
            src="/auth-bg.png" 
            alt="Dashboard Preview" 
            fill 
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-black/60 z-10" />
        
        <div className="relative z-20 p-12 max-w-lg text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 inline-block mb-6">
              <Image src="/Logo.png" alt="Logo" width={48} height={48} className="invert brightness-0" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">
              MAÎTRISEZ VOTRE <span className="text-primary-foreground/80">PRÉSENCE.</span>
            </h1>
            <p className="text-xl text-white/80 font-medium leading-relaxed mb-8">
              L'outil de gestion d'assiduité nouvelle génération pour les formateurs et les organisations modernes.
            </p>
            
            <div className="space-y-4">
              {[
                "Isolation complète de vos données",
                "Tableaux de bord dynamiques",
                "Gestion multicours personnalisée"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-white/90">
                  <div className="size-6 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <span className="font-semibold">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 relative">
        {/* Animated Background Blob for Mobile */}
        <div className="absolute top-0 right-0 -z-10 size-64 bg-primary/5 blur-3xl opacity-50 rounded-full" />
        <div className="absolute bottom-0 left-0 -z-10 size-96 bg-primary/10 blur-3xl opacity-30 rounded-full" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Header for Mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-background p-2 rounded-xl border border-border shadow-sm">
                <Image src="/Logo.png" alt="Logo" width={32} height={32} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-primary uppercase">Presence</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">
              {isForgotPassword 
                ? "Réinitialiser" 
                : isSignUp 
                  ? "Créer un espace" 
                  : "Bon retour parmi nous"}
            </h2>
            <p className="text-muted-foreground font-medium">
              {isForgotPassword
                ? "Entrez votre email pour recevoir un lien de récupération."
                : isSignUp 
                  ? "Configurez votre plateforme de formation en quelques secondes." 
                  : "Connectez-vous pour accéder à votre tableau de bord."}
            </p>
          </div>

          <Tabs 
            value={isSignUp ? "signup" : "login"} 
            onValueChange={(v) => {
              setIsSignUp(v === "signup")
              setIsForgotPassword(false)
              setStep(1)
              setError(null)
              setSuccess(null)
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {isForgotPassword ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                    <form onSubmit={handleAuth}>
                      <CardHeader>
                        <CardTitle className="text-lg">Récupération de compte</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {error && (
                          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <p>{error}</p>
                          </div>
                        )}
                        {success && (
                          <div className="bg-success/10 border border-success/20 text-success text-sm p-3 rounded-lg flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <p>{success}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="email-forgot">Email enregistré</Label>
                          <Input
                            id="email-forgot"
                            type="email"
                            placeholder="nom@exemple.com"
                            className="h-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-4 pt-2">
                        <Button type="submit" className="w-full h-10 font-bold" disabled={loading}>
                          {loading ? <Loader2 className="size-4 animate-spin" /> : "Envoyer le lien"}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(false)}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          Retour à la connexion
                        </button>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              ) : step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                    <form onSubmit={handleAuth}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {isSignUp ? "Démarrer maintenant" : "Veuillez vous identifier"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {error && (
                          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <p>{error}</p>
                          </div>
                        )}
                        {success && (
                          <div className="bg-success/10 border border-success/20 text-success text-sm p-3 rounded-lg flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <p>{success}</p>
                          </div>
                        )}
                        {isSignUp && (
                          <div className="space-y-2">
                            <Label htmlFor="fullname">Nom complet</Label>
                            <Input
                              id="fullname"
                              placeholder="Prénom Nom"
                              className="h-10"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required={isSignUp}
                              disabled={loading}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email professionnel</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="nom@entreprise.com"
                            className="h-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Mot de passe</Label>
                            {!isSignUp && (
                              <button
                                type="button"
                                onClick={() => setIsForgotPassword(true)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Oublié ?
                              </button>
                            )}
                          </div>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="h-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button type="submit" className="w-full h-11 font-bold group" disabled={loading}>
                          {loading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : isSignUp ? (
                            <>
                              Continuer
                              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                            </>
                          ) : (
                            "Accéder à mon espace"
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                    <form onSubmit={handleAuth}>
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                        <button 
                          type="button" 
                          onClick={() => setStep(1)}
                          className="p-1 rounded-full hover:bg-muted transition-colors"
                          disabled={loading}
                        >
                          <ChevronLeft className="size-5" />
                        </button>
                        <CardTitle className="text-lg">Détails de votre formation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {error && (
                          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <p>{error}</p>
                          </div>
                        )}
                        {success && (
                          <div className="bg-success/10 border border-success/20 text-success text-sm p-3 rounded-lg flex items-center gap-2">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <p>{success}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="role">Je suis...</Label>
                          <select
                            id="role"
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            required
                            disabled={loading}
                          >
                            <option value="coach">Un Coach</option>
                            <option value="campus_manager">Un Campus Manager</option>
                          </select>
                        </div>
                        {selectedRole === "coach" && (
                          <div className="space-y-2">
                            <Label htmlFor="formation">Votre formation</Label>
                            <select
                              id="formation"
                              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              value={formationName}
                              onChange={(e) => setFormationName(e.target.value)}
                              required={selectedRole === "coach"}
                              disabled={loading}
                            >
                              <option value="">Sélectionnez votre cohorte...</option>
                              {Array.isArray(formations) && formations.map((f: any) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                            {Array.isArray(formations) && formations.length === 0 && (
                              <p className="text-[10px] text-muted-foreground italic">
                                Note : Si votre formation n'est pas listée, contactez l'administrateur.
                              </p>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="organization">Organisation / Ecole</Label>
                          <Input
                            id="organization"
                            placeholder="Ex: Digital Academy, Freelance..."
                            className="h-10"
                            value={orgaName}
                            onChange={(e) => setOrgaName(e.target.value)}
                            required
                            disabled={loading}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button type="submit" className="w-full h-10 font-bold" disabled={loading}>
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            "Finaliser l'inscription"
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
          
        </motion.div>
      </div>
    </div>
  )
}
