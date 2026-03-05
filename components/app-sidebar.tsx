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
  { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { label: "Presence", href: "/presence", icon: ClipboardCheck },
  { label: "Apprenants", href: "/apprenants", icon: Users },
  { label: "Statistiques", href: "/statistiques", icon: BarChart3 },
  { label: "Documentation", href: "/documentation", icon: GraduationCap },
  { label: "Paramètres", href: "/parametres", icon: Database },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  const { data: settings } = useSWR("settings", fetchSettings)
  const { data: profile } = useSWR("profile", fetchProfile)
  
  const supabase = createClient()

  // Dynamic items based on role
  const dynamicNavItems = [...baseNavItems]
  if (profile?.role === 'campus_manager' || profile?.role === 'super_admin') {
    dynamicNavItems.splice(4, 0, { label: "Vue Campus", href: "/campus-manager", icon: TrendingUp })
  }
  if (profile?.role === 'super_admin') {
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
        <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
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
              {profile?.formation_label || "Suivi de Présence"}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white font-bold">
                {profile?.orga_name || "CENTRE DE FORMATION"}
              </span>
              {profile?.role && profile.role !== 'coach' && (
                <Badge variant="default" className="text-[8px] h-3 px-1 bg-primary text-white uppercase font-black">
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
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                const supabase = createClient()
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
