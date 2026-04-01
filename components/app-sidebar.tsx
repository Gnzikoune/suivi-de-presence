"use client"

import Link from "next/link"
import NextImage from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  BarChart3,
  GraduationCap,
  Database,
  LogOut,
  ShieldCheck,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase-browser"
import useSWR, { mutate } from "swr"
import { fetchSettings, saveSetting, fetchProfile } from "@/lib/api-service"
import { useEffect, useState } from "react"

const baseNavItems = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Presence", href: "/presence", icon: ClipboardCheck },
  { label: "Apprenants", href: "/apprenants", icon: Users },
  { label: "Cohortes", href: "/cohortes", icon: GraduationCap },
  { label: "Statistiques", href: "/statistiques", icon: BarChart3 },
  { label: "Paramètres", href: "/parametres", icon: Database },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile, toggleSidebar, state } = useSidebar()
  const { data: settings } = useSWR("settings", fetchSettings)
  const { data: profile } = useSWR("profile", fetchProfile)
  
  const supabase = createClient()

  // Dynamic items based on role
  const dynamicNavItems = [...baseNavItems]
  if (profile?.role === 'campus_manager' || profile?.role === 'super_admin') {
    dynamicNavItems.splice(4, 0, { label: "Vue Campus", href: "/campus-manager", icon: MapPin })
    dynamicNavItems.splice(5, 0, { label: "Administration", href: "/super-admin", icon: ShieldCheck })
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
          <div className="flex shrink-0 items-center justify-center rounded-lg overflow-hidden bg-background p-1 border border-border group-data-[collapsible=icon]:size-8">
            <NextImage
              src="/Logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm text-white uppercase tracking-tight">
              {profile?.orga_name || "Suivi de Présence"}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white/70 font-bold flex items-center gap-1">
                {(profile?.memberships?.[0] as any)?.campuses?.name ? (
                  <>
                    <MapPin className="size-2" />
                    {(profile?.memberships?.[0] as any)?.campuses?.name}
                  </>
                ) : (
                  "CENTRE DE FORMATION"
                )}
              </span>
              {profile?.role && profile.role !== 'coach' && (
                <Badge variant="default" className="text-[8px] h-3 px-1 bg-primary text-white uppercase font-black ml-1">
                  {profile.role.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dynamicNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
                    tooltip={item.label}
                  >
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem className="hidden md:block mb-2">
            <SidebarMenuButton
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground"
              tooltip={state === "expanded" ? "Réduire le menu" : "Afficher le menu"}
            >
              {state === "expanded" ? (
                <ChevronLeft className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              <span className="font-medium text-xs">
                {state === "expanded" ? "Réduire le menu" : "Afficher le menu"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                const supabase = createClient()
                // Log logout event before signing out
                try {
                  await fetch("/api/auth/audit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: 'LOGOUT' })
                  })
                } catch (e) {
                  console.error("Failed to log logout event", e)
                }
                
                await supabase.auth.signOut()
                window.location.href = "/login"
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              tooltip="Se déconnecter"
            >
              <LogOut className="size-4" />
              <div className="flex flex-col items-start leading-none gap-1">
                <span className="font-bold text-xs">Déconnexion</span>
                <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">
                  {profile?.full_name || profile?.email || "Chargement..."}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
