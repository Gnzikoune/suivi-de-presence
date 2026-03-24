"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  className?: string
  iconClassName?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  trendLabel?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
  iconClassName,
  trend,
  trendValue,
  trendLabel,
}: StatsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3 md:p-3.5">
        <CardTitle className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex size-6 md:size-7 items-center justify-center rounded-md shrink-0",
            iconClassName || "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-3.5 md:size-4" />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 md:px-3.5 md:pb-3.5 pt-0">
        <div className="flex items-baseline gap-2">
          <div className="text-lg md:text-xl font-bold text-foreground leading-none">
            {value}
          </div>
          {trend && trendValue && (
            <div className={cn(
              "flex items-center text-[10px] font-bold",
              trend === 'up' ? "text-success" : trend === 'down' ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend === 'up' ? <ArrowUpRight className="size-3 mr-0.5" /> : trend === 'down' ? <ArrowDownRight className="size-3 mr-0.5" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        {(subtitle || trendLabel) && (
          <div className="flex flex-col mt-1">
            {trendLabel && (
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">
                {trendLabel}
              </span>
            )}
            {subtitle && (
              <p className="text-[9px] md:text-[10px] text-muted-foreground line-clamp-1 italic">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
