"use client"

import { useState, useEffect } from "react"
import { Lock, LogIn, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { Session } from "@supabase/supabase-js"
import {
  saveOfflineUser,
  getOfflineUser,
  clearOfflineUser,
  isNetworkAvailable
} from "@/lib/offline-storage"

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        // 1. First get local session from browser storage (works offline)
        const { data: { session: localSession } } = await supabase.auth.getSession()
        const cachedOfflineUser = getOfflineUser()

        if (!isNetworkAvailable()) {
          // OFFLINE MODE: Rely on cached local session or offline user record
          if (localSession || cachedOfflineUser) {
            if (mounted) {
              setSession(localSession || ({ user: cachedOfflineUser } as any))
              setChecking(false)
            }
            return
          }
        }

        // ONLINE: Verify with server
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (mounted && user) {
            saveOfflineUser({
              id: user.id,
              email: user.email,
              cachedAt: Date.now()
            })
            setSession(localSession)
          } else if (mounted && cachedOfflineUser && !isNetworkAvailable()) {
            setSession({ user: cachedOfflineUser } as any)
          }
        } catch (netErr) {
          console.warn("[AuthGate] Network check failed, fallback to local session", netErr)
          if (localSession || cachedOfflineUser) {
            if (mounted) setSession(localSession || ({ user: cachedOfflineUser } as any))
          }
        }
        
        if (mounted) setChecking(false)
      } catch (err) {
        console.error("Auth session check error:", err)
        // Fallback to offline user if available
        const offlineUser = getOfflineUser()
        if (offlineUser && mounted) {
          setSession({ user: offlineUser } as any)
        }
        if (mounted) setChecking(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (mounted) {
        setSession(newSession)
        
        if (newSession?.user) {
          saveOfflineUser({
            id: newSession.user.id,
            email: newSession.user.email,
            cachedAt: Date.now()
          })
        }

        // Handle post-auth events
        if (event === 'SIGNED_IN' && (pathname === '/login' || pathname === '/')) {
          router.push('/dashboard')
        }
        if (event === 'SIGNED_OUT') {
          clearOfflineUser()
          if (pathname !== '/login') {
            router.push('/login')
          }
        }
      }
    })

    checkSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  // Redirection logic
  useEffect(() => {
    if (checking) return

    const isPublicPath = pathname === "/" || pathname === "/login" || pathname === "/update-password" || pathname === "/documentation"
    const hasOfflineAccess = !isNetworkAvailable() && !!getOfflineUser()
    const isAuthenticated = !!session || hasOfflineAccess

    if (!isAuthenticated && !isPublicPath) {
      // Check for auth parameters (invitation/recovery/PKCE)
      const hasAuthParams = typeof window !== 'undefined' && 
                          (window.location.hash.includes('access_token=') || 
                           window.location.search.includes('code=') ||
                           window.location.hash.includes('type=invite') ||
                           window.location.hash.includes('type=recovery') ||
                           window.location.hash.includes('type=signup'))
      
      if (!hasAuthParams) {
        router.push("/login")
      }
    }

    if (isAuthenticated && (pathname === "/login" || pathname === "/")) {
      router.push("/dashboard")
    }
  }, [session, checking, pathname, router])

  if (checking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/30">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // If we're on a public page, just show it
  if (pathname === "/" || pathname === "/login" || pathname === "/update-password" || pathname === "/documentation") {
    return <>{children}</>
  }

  // If not on login and no session, we show loader while potentially processing params
  if (!session) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/30">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
