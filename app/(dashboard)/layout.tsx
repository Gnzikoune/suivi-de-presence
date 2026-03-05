"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageShell } from "@/components/page-shell"
import { AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase-browser"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertCircle, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showReminder, setShowReminder] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.needs_password_update) {
        setShowReminder(true)
        // Also show a toast
        toast.info("Bienvenue ! Pour sécuriser votre compte, veuillez définir un mot de passe.", {
          duration: 10000,
          id: 'password-reminder'
        })
      }
    }
    checkUserStatus()
  }, [supabase])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {showReminder && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between gap-4 sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center gap-2 text-primary text-sm font-semibold">
              <Key className="size-4" />
              <span>C'est votre première connexion. Veuillez définir un mot de passe pour sécuriser votre accès.</span>
            </div>
            <Button asChild size="sm" variant="default" className="h-8">
              <Link href="/update-password">Définir mon mot de passe</Link>
            </Button>
          </div>
        )}
        <AnimatePresence mode="wait">
          <PageShell key="page-shell">
            {children}
          </PageShell>
        </AnimatePresence>
      </SidebarInset>
    </SidebarProvider>
  )
}
