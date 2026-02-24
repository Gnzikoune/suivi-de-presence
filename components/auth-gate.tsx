"use client"

import { useState, useEffect } from "react"
import { Lock, LogIn, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(true)

  const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD

  useEffect(() => {
    // Check local storage for session
    const authSession = localStorage.getItem("auth_session")
    if (authSession === "true") {
      setIsAuthenticated(true)
    }
    setChecking(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === APP_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("auth_session", "true")
      setError(false)
    } else {
      setError(true)
      setPassword("")
    }
  }

  if (checking) return null

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Card className="border-primary/20 shadow-2xl backdrop-blur-sm bg-background/95">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Lock className="size-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Accès Sécurisé</CardTitle>
              <CardDescription>
                Veuillez saisir votre mot de passe pour accéder au système de présence.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="Mot de passe"
                      className={`pr-10 h-11 focus-visible:ring-primary ${error ? "border-destructive ring-destructive" : ""}`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error) setError(false)
                      }}
                      autoFocus
                    />
                    <LogIn className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-destructive text-xs font-medium"
                      >
                        <AlertCircle className="size-3" />
                        Mot de passe incorrect
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button type="submit" className="w-full h-11 font-bold shadow-lg shadow-primary/20">
                  Déverrouiller
                </Button>
              </CardFooter>
            </form>
          </Card>
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground/50 italic">
              Système de suivi de présence privé • © 2026
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
