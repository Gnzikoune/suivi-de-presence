"use client"

import Link from "next/link"
import NextImage from "next/image"

export function MarketingFooter() {
  return (
    <footer className="py-12 border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <div className="size-6 relative">
            <NextImage src="/Logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-sm tracking-tight uppercase">Suivi de Présence</span>
        </div>
        <p className="text-sm text-muted-foreground italic">
          Réalisé avec par Gildas NZIKOUNÉ
        </p>
        <div className="flex gap-6">
          <Link href="https://wa.me/241077305184" className="text-muted-foreground hover:text-primary transition-colors font-medium">Support</Link>
          <Link href="https://www.linkedin.com/in/gildas-nzikoune" className="text-muted-foreground hover:text-primary transition-colors font-medium">LinkedIn</Link>
        </div>
      </div>
    </footer>
  )
}
