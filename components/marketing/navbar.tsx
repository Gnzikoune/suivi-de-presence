"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import NextImage from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MarketingNavbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="size-8 relative">
            <NextImage
              src="/Logo.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold text-lg tracking-tight uppercase">Suivi de Présence</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            asChild 
            className={cn(
              "hidden sm:flex rounded-full px-5",
              pathname === "/" && "bg-primary/10 text-primary"
            )}
          >
            <Link href="/">Accueil</Link>
          </Button>
          <Button 
            variant="ghost" 
            asChild 
            className={cn(
              "hidden sm:flex rounded-full px-5",
              pathname === "/documentation" && "bg-primary/10 text-primary"
            )}
          >
            <Link href="/documentation">Documentation</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6 ml-3">
            <Link href="/login">Accéder</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
