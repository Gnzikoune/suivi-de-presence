"use client"

import { useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Users,
  CalendarDays,
  TrendingDown,
  ClipboardCheck,
  ArrowRight,
  UserCheck,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchStudents, fetchRecords, fetchSettings } from "@/lib/api-service"
import {
  getGlobalStats,
  getTodayClassSummary,
} from "@/lib/attendance-utils"
import { StatsSkeleton } from "@/components/stats-skeleton"
import type { Student, AttendanceRecord } from "@/lib/types"
import { FORMATION_START, FORMATION_END } from "@/lib/constants"

export default function DashboardPage() {
  const { data: students, isLoading: isLoadingStudents } = useSWR("students", fetchStudents)
  const { data: records, isLoading: isLoadingRecords } = useSWR("records", fetchRecords)
  const { data: settings } = useSWR("settings", fetchSettings)

  const isLoading = isLoadingStudents || isLoadingRecords

  const formStart = settings?.FORMATION_START || FORMATION_START
  const formEnd = settings?.FORMATION_END || FORMATION_END

  const globalStats = useMemo(
    () => getGlobalStats(students || [], records || [], formStart, formEnd),
    [students, records, formStart, formEnd]
  )

  const todayMorning = useMemo(
    () => getTodayClassSummary(students || [], records || [], "morning"),
    [students, records]
  )

  const todayAfternoon = useMemo(
    () => getTodayClassSummary(students || [], records || [], "afternoon"),
    [students, records]
  )

  // Prepare chart data: last 10 recorded days
  const chartData = useMemo(() => {
    const morningDays = globalStats.morningStats.dailyStats
    const afternoonDays = globalStats.afternoonStats.dailyStats

    const allDates = new Set([
      ...morningDays.map((d) => d.date),
      ...afternoonDays.map((d) => d.date),
    ])

    const sorted = Array.from(allDates).sort()
    const lastDays = sorted.slice(-15)

    return lastDays.map((date) => {
      const m = morningDays.find((d) => d.date === date)
      const a = afternoonDays.find((d) => d.date === date)
      return {
        date: format(new Date(date), "dd MMM", { locale: fr }),
        Matin: m?.rate || 0,
        "Apres-midi": a?.rate || 0,
      }
    })
  }, [globalStats])

  const comparisonData = [
    {
      name: "Matin",
      presence: globalStats.morningStats.averagePresenceRate,
      absenteisme: globalStats.morningStats.averageAbsenteeismRate,
    },
    {
      name: "Apres-midi",
      presence: globalStats.afternoonStats.averagePresenceRate,
      absenteisme: globalStats.afternoonStats.averageAbsenteeismRate,
    },
  ]

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Tableau de bord"
        description={`Formation Marketing Digital - ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`}
      />

      <div className="flex flex-col gap-6 p-4 md:p-6 pb-20 max-w-5xl mx-auto w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            <>
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Apprenants"
                value={globalStats.totalStudents}
                subtitle={`${globalStats.morningStudents} Matin / ${globalStats.afternoonStudents} Apres-midi`}
                icon={Users}
                iconClassName="bg-blue-500/10 text-blue-600"
              />
              <StatsCard
                title="Presence Aujourd'hui"
                value={`${todayMorning.present + todayAfternoon.present} / ${todayMorning.total + todayAfternoon.total}`}
                subtitle={`Matin: ${todayMorning.present}/${todayMorning.total} | Apres-midi: ${todayAfternoon.present}/${todayAfternoon.total}`}
                icon={UserCheck}
                iconClassName="bg-success/10 text-success"
              />
              <StatsCard
                title="Absenteisme Moyen"
                value={`${globalStats.globalAbsenteeismRate}%`}
                subtitle="Depuis le debut de la formation"
                icon={TrendingDown}
                iconClassName="bg-destructive/10 text-destructive"
              />
              <StatsCard
                title="Jours Ecoules"
                value={`${globalStats.elapsedDays} / ${globalStats.totalDays}`}
                subtitle={`Du 16/02 au 30/08/2026`}
                icon={CalendarDays}
                iconClassName="bg-chart-5/10 text-chart-5"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="group cursor-pointer transition-colors hover:border-primary/30">
            <Link href="/presence" className="block">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardCheck className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Faire l{"'"}appel
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Saisir la presence du jour
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Link>
          </Card>
          <Card className="group cursor-pointer transition-colors hover:border-primary/30">
            <Link href="/apprenants" className="block">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Users className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Gerer les apprenants
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ajouter, modifier ou supprimer
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Evolution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Evolution du taux de presence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  Aucune donnee de presence enregistree.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180} className="md:h-[260px]">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                      interval={"preserveStartEnd"}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      unit="%"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        `${value}%`,
                        undefined,
                      ]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="Matin"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Apres-midi"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Comparaison Matin vs Apres-midi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {globalStats.totalStudents === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  Aucune donnee a afficher.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200} className="md:h-[280px]">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      unit="%"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        `${value}%`,
                        undefined,
                      ]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="presence"
                      name="Presence"
                      fill="var(--color-chart-2)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="absenteisme"
                      name="Absenteisme"
                      fill="var(--color-chart-3)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
