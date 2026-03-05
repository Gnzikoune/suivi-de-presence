"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  // Assuming 'profile' is a new prop being introduced or already exists elsewhere
  // If not, this will cause a type error. Adding it for now based on the code edit.
  return (
    <header className="sticky top-0 z-50 flex flex-col gap-2 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger className="-ml-1 size-9" />
        <Separator orientation="vertical" className="mr-1 h-4" />
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-bold text-primary uppercase tracking-wider truncate">
              {title}
            </h1>
            {description && (
              <p className="text-[10px] md:text-xs text-foreground/90 truncate font-semibold">
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
