"use client"

import { useState, useEffect } from "react"
import { Lock, LogIn, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { Session, AuthChangeEvent } from "@supabase/supabase-js"

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
        const { data: { user } } = await supabase.auth.getUser()
        if (mounted) {
          // Note: we can still follow onAuthStateChange for session, 
          // but getUser() is the secure way for the initial check.
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          setSession(currentSession)
          setChecking(false)
        }
      } catch (err) {
        console.error("Auth session check error:", err)
        if (mounted) setChecking(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (mounted) {
        setSession(newSession)
        
        // Handle post-auth events
        if (event === 'SIGNED_IN' && pathname === '/login') {
          router.push('/')
          router.refresh()
        }
        if (event === 'SIGNED_OUT' && pathname !== '/login') {
          router.push('/login')
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

    const isPublicPath = pathname === "/login" || pathname === "/update-password"
    
    if (!session && !isPublicPath) {
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

    if (session && pathname === "/login") {
      router.push("/")
    }
  }, [session, checking, pathname, router])

  if (checking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/30">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // If we're on login or update-password page, just show it
  if (pathname === "/login" || pathname === "/update-password") {
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
