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
} from "lucide-react"
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

const navItems: { label: string; href: string; icon: any }[] = [
  {
    label: "Tableau de bord",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Presence",
    href: "/presence",
    icon: ClipboardCheck,
  },
  {
    label: "Apprenants",
    href: "/apprenants",
    icon: Users,
  },
  {
    label: "Statistiques",
    href: "/statistiques",
    icon: BarChart3,
  },
  {
    label: "Documentation",
    href: "/documentation",
    icon: GraduationCap,
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Database,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()

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
            <span className="font-bold text-sm text-primary uppercase tracking-tight">Suivi de Présence</span>
            <span className="text-[10px] text-muted-foreground font-medium">FORMATIONS DIGITALES</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
              onClick={() => {
                localStorage.removeItem("auth_session")
                window.location.href = "/"
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              tooltip="Se déconnecter"
            >
              <LogOut className="size-4" />
              <span className="font-bold">Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
