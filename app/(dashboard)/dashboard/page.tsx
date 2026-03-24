"use client"

import { useMemo, useEffect } from "react"
import useSWR from "swr"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Users,
  CalendarDays,
  TrendingDown,
  ClipboardCheck,
  ArrowRight,
  UserCheck,
  Megaphone,
  GraduationCap
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
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { fetchStudents, fetchRecords, fetchSettings, fetchProfile, fetchCohorts } from "@/lib/api-service"
import {
  getGlobalStats,
  getTodayClassSummary,
} from "@/lib/attendance-utils"
import { StatsSkeleton } from "@/components/stats-skeleton"
import type { Student, AttendanceRecord } from "@/lib/types"
import { FORMATION_START, FORMATION_END } from "@/lib/constants"
import { useState } from "react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    const info = await res.json()
    ;(error as any).info = info
    ;(error as any).status = res.status
    throw error
  }
  return res.json()
}

export default function DashboardPage() {
  const [selectedCohortId, setSelectedCohortId] = useState<string>("all")
  
  const { data: profile } = useSWR("profile", fetchProfile)
  const { data: cohorts } = useSWR("cohorts", fetchCohorts)



  const handleCohortChange = (id: string) => {
    setSelectedCohortId(id)
    localStorage.setItem("dashboard_cohort_selected", "true")
  }
  const { data: students, isLoading: isLoadingStudents } = useSWR(
    ["students", selectedCohortId], 
    () => fetchStudents(selectedCohortId === "all" ? undefined : selectedCohortId)
  )
  const { data: records, isLoading: isLoadingRecords } = useSWR(
    ["records", selectedCohortId], 
    () => fetchRecords(undefined, undefined, undefined, selectedCohortId === "all" ? undefined : selectedCohortId)
  )
  const { data: settings } = useSWR("settings", fetchSettings)
  const { data: announcements } = useSWR(profile ? "/api/super-admin/announcements" : null, fetcher)

  const selectedCohort = useMemo(() => {
    return cohorts?.find((c: any) => c.id === selectedCohortId)
  }, [cohorts, selectedCohortId])

  const isLoading = isLoadingStudents || isLoadingRecords

  const formStart = selectedCohort?.startDate || settings?.FORMATION_START || FORMATION_START
  const formEnd = selectedCohort?.endDate || settings?.FORMATION_END || FORMATION_END

  // Filter records manually if cohort is selected, as fetchRecords doesn't support cohortId directly yet
  // but many records might exist. Better for stats utility to handle filtered arrays.
  const filteredRecords = useMemo(() => {
    if (!records || selectedCohortId === "all") return records || []
    if (!students) return []
    const studentIds = new Set(students.map(s => s.id))
    return records.filter(r => studentIds.has(r.studentId))
  }, [records, students, selectedCohortId])

  const globalStats = useMemo(
    () => getGlobalStats(students || [], filteredRecords, formStart, formEnd),
    [students, filteredRecords, formStart, formEnd]
  )

  const todayMorning = useMemo(
    () => getTodayClassSummary(students || [], filteredRecords, "morning"),
    [students, filteredRecords]
  )

  const todayAfternoon = useMemo(
    () => getTodayClassSummary(students || [], filteredRecords, "afternoon"),
    [students, filteredRecords]
  )

  // ... rest of useMemo for charts remains same ...
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
        description={`${profile?.orga_name || "CENTRE DE FORMATION"} - ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`}
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="size-4 text-muted-foreground" />
          <Select value={selectedCohortId} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-[240px] bg-background">
              <SelectValue placeholder="Toutes les cohortes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les cohortes</SelectItem>
              {cohorts?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.campuses?.name ? `(${c.campuses.name})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 p-4 md:p-6 pb-20 max-w-5xl mx-auto w-full">
        {/* Announcements Section */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : announcements && announcements.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Megaphone className="size-5" />
              <h3>Annonces de l'administration</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {announcements.map((a: any) => (
                <Card key={a.id} className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{a.title}</span>
                      <span className="text-[10px] font-normal text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">— {a.author_name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <StatsSkeleton key={i} />
            ))
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
                title="Jours Écoulés"
                value={`${globalStats.elapsedDays} / ${globalStats.totalDays}`}
                subtitle={`Du ${format(parseISO(formStart), "dd/MM")} au ${format(parseISO(formEnd), "dd/MM/yyyy")}`}
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
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
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
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
