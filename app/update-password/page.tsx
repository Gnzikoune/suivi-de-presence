"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, CheckCircle2, ShieldCheck, Lock } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { getErrorMessage } from "@/lib/error-utils"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

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
            <h2 className="text-2xl font-black tracking-tight text-foreground mb-1">Nouveau mot de passe</h2>
            <p className="text-sm text-muted-foreground font-medium">
              Veuillez saisir votre nouveau mot de passe ci-dessous.
            </p>
          </div>

          <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
            <form onSubmit={handleUpdate}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                   <Lock className="size-4 text-primary" />
                   Changement de sécurité
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
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || !!success}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="h-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || !!success}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button type="submit" className="w-full h-10 font-bold" disabled={loading || !!success}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Mettre à jour le mot de passe"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <div className="mt-4 pt-3 border-t border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground">
              Développé avec passion par{" "}
              <a 
                href="https://www.linkedin.com/in/gildas-nzikoune" 
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
