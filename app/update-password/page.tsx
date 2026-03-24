"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { getErrorMessage } from "@/lib/error-utils"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [invitedName, setInvitedName] = useState("")
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 1. FORCER LA LECTURE DU TOKEN DE L'URL SI NEXT.JS/SSR LE BLOQUE
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        
        if (access_token && refresh_token) {
          supabase.auth.setSession({ access_token, refresh_token }).then(() => {
            // Nettoyer l'URL
            window.history.replaceState(null, '', window.location.pathname)
          })
        }
      }
    }

    // 2. Écouter les événements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          if (session?.user?.user_metadata?.needs_password_update) {
            setIsNewUser(true)
            setInvitedName(session.user.user_metadata.full_name || "")
          }
        }
      }
    )

    // 3. Vérification classique si la session est déjà là
    const checkStatus = async () => {
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (user?.user_metadata?.needs_password_update) {
          setIsNewUser(true)
          setInvitedName(user.user_metadata.full_name || "")
        }
      }, 500)
    }
    checkStatus()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(getErrorMessage(updateError))
      } else {
        setSuccess("Votre mot de passe a été mis à jour avec succès.")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {/* Left Side: Decorative Image (Reuse same style as login) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-60">
          <Image 
            src="/auth-bg.png" 
            alt="Security Background" 
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
              <ShieldCheck className="size-12 text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none uppercase">
              Sécurisez <span className="text-primary-foreground/80">VOTRE COMPTE.</span>
            </h1>
            <p className="text-xl text-white/80 font-medium leading-relaxed mb-8">
              La sécurité de vos données est notre priorité absolue. Définissez un mot de passe robuste.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Update Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground mb-1">
              {isNewUser ? `Bienvenue ${invitedName} !` : "Nouveau mot de passe"}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {isNewUser 
                ? "Votre accès est prêt. Veuillez définir votre mot de passe pour commencer." 
                : "Veuillez saisir votre nouveau mot de passe ci-dessous."}
            </p>
          </div>

          <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
            <form onSubmit={handleUpdate}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                   <Lock className="size-4 text-primary" />
                   {isNewUser ? "Activation de votre compte" : "Changement de sécurité"}
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
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading || !!success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading || !!success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button type="submit" className="w-full h-10 font-bold" disabled={loading || !!success}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isNewUser ? "Activation..." : "Mise à jour..."}
                    </>
                  ) : (
                    isNewUser ? "Activer mon compte" : "Mettre à jour le mot de passe"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <div className="mt-4 pt-3 border-t border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">
              Développé avec par{" "}
              <a 
                href="https://wa.me/241077305184" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline"
              >
                Gildas NZIKOUNÉ
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
