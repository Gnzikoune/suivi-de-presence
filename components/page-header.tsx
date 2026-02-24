"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex flex-col gap-2 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 px-3 py-2.5 md:px-6 md:py-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 size-8" />
        <Separator orientation="vertical" className="mr-1 h-3.5" />
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xs md:text-sm-fluid font-bold text-primary uppercase tracking-wide truncate">
              {title}
            </h1>
            {description && (
              <p className="text-[10px] md:text-xs text-muted-foreground truncate opacity-80">
                {description}
              </p>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-1.5 shrink-0">{children}</div>
          )}
        </div>
      </div>
    </header>
  )
}
