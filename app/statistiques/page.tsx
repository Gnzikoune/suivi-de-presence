"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  User,
  Globe,
  BarChart3,
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
  Cell,
} from "recharts"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchStudents, fetchRecords, fetchSettings } from "@/lib/api-service"
import {
  getGlobalStats,
  getStudentStats,
  getClassStats,
} from "@/lib/attendance-utils"
import {
  exportStudentStatsToExcel,
  exportGlobalSummaryToExcel,
} from "@/lib/export-utils"
import type { Student, AttendanceRecord, ClassId } from "@/lib/types"
import { FORMATION_START, FORMATION_END } from "@/lib/constants"

// --- Individual Tab ---
function IndividualTab({
  students,
  records,
  formationStart,
  formationEnd,
}: {
  students: Student[]
  records: AttendanceRecord[]
  formationStart: string
  formationEnd: string
}) {
  const [selectedId, setSelectedId] = useState<string>("")

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
          "fr"
        )
      ),
    [students]
  )

  const stats = useMemo(() => {
    const student = students.find((s) => s.id === selectedId)
    if (!student) return null
    return getStudentStats(student, records, formationStart, formationEnd)
  }, [selectedId, students, records, formationStart, formationEnd])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full sm:max-w-sm">
            <SelectValue placeholder="Choisir un apprenant..." />
          </SelectTrigger>
          <SelectContent>
            {sortedStudents.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.lastName} {s.firstName} ({s.classId === "morning" ? "Matin" : "Apres-midi"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {stats && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportStudentStatsToExcel(
                [stats],
                `presence-${stats.student.lastName}-${stats.student.firstName}`
              )
            }
          >
            <Download className="size-4" />
            Exporter Excel
          </Button>
        )}
      </div>

      {!stats ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground rounded-lg border border-border bg-card">
          Selectionnez un apprenant pour voir ses statistiques.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Taux de Presence"
              value={`${stats.presenceRate}%`}
              icon={UserCheck}
              iconClassName="bg-success/10 text-success"
            />
            <StatsCard
              title="Taux d'Absenteisme"
              value={`${stats.absenteeismRate}%`}
              icon={TrendingDown}
              iconClassName="bg-destructive/10 text-destructive"
            />
            <StatsCard
              title="Jours Presents"
              value={stats.daysPresent}
              subtitle={`sur ${stats.totalDays} jours ecoules`}
              icon={TrendingUp}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatsCard
              title="Jours Absents"
              value={stats.daysAbsent}
              subtitle={`sur ${stats.totalDays} jours ecoules`}
              icon={BarChart3}
              iconClassName="bg-warning/10 text-warning-foreground"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fiche de l{"'"}apprenant</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nom complet</span>
                  <p className="font-medium text-foreground">
                    {stats.student.lastName} {stats.student.firstName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Classe</span>
                  <p>
                    <Badge
                      className={
                        stats.student.classId === "morning"
                          ? "bg-success text-success-foreground"
                          : "bg-primary text-primary-foreground"
                      }
                    >
                      {stats.student.classId === "morning"
                        ? "Matin (08h30-13h00)"
                        : "Apres-midi (14h00-18h30)"}
                    </Badge>
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Progression presence
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {stats.presenceRate}%
                  </span>
                </div>
                <Progress value={stats.presenceRate} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// --- Class Tab ---
function ClassTab({
  students,
  records,
  formationStart,
  formationEnd,
}: {
  students: Student[]
  records: AttendanceRecord[]
  formationStart: string
  formationEnd: string
}) {
  const [selectedClass, setSelectedClass] = useState<ClassId>("morning")

  const classStats = useMemo(
    () => getClassStats(students, records, selectedClass, formationStart, formationEnd),
    [students, records, selectedClass, formationStart, formationEnd]
  )

  const sortedByAbsence = useMemo(
    () =>
      [...classStats.studentStats].sort(
        (a, b) => b.absenteeismRate - a.absenteeismRate
      ),
    [classStats]
  )

  const chartData = useMemo(() => {
    return classStats.dailyStats.slice(-15).map((d) => ({
      date: format(new Date(d.date), "dd MMM", { locale: fr }),
      taux: d.rate,
    }))
  }, [classStats])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={selectedClass}
          onValueChange={(v) => setSelectedClass(v as ClassId)}
        >
          <TabsList>
            <TabsTrigger value="morning">Matin</TabsTrigger>
            <TabsTrigger value="afternoon">Apres-midi</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportStudentStatsToExcel(
              classStats.studentStats,
              `presence-classe-${selectedClass === "morning" ? "matin" : "apres-midi"}`
            )
          }
        >
          <Download className="size-4" />
          Exporter Excel
        </Button>
      </div>

      {/* Class KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          title="Taux de Presence"
          value={`${classStats.averagePresenceRate}%`}
          subtitle={`${classStats.studentStats.length} apprenants`}
          icon={UserCheck}
          iconClassName="bg-success/10 text-success"
        />
        <StatsCard
          title="Taux d'Absenteisme"
          value={`${classStats.averageAbsenteeismRate}%`}
          icon={TrendingDown}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <StatsCard
          title="Effectif"
          value={classStats.studentStats.length}
          subtitle={
            selectedClass === "morning"
              ? "08h30 - 13h00"
              : "14h00 - 18h30"
          }
          icon={Users}
          iconClassName="bg-primary/10 text-primary"
        />
      </div>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Evolution du taux de presence - {selectedClass === "morning" ? "Matin" : "Apres-midi"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Aucune donnee disponible.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--card-foreground)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Presence"]}
                />
                <Line
                  type="monotone"
                  dataKey="taux"
                  name="Taux de presence"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Student Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Classement des apprenants (par absenteisme)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prenom</TableHead>
                <TableHead className="text-center">Presents</TableHead>
                <TableHead className="text-center">Absents</TableHead>
                <TableHead className="text-center">Presence</TableHead>
                <TableHead className="text-center">Absenteisme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByAbsence.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aucun apprenant dans cette classe.
                  </TableCell>
                </TableRow>
              ) : (
                sortedByAbsence.map((s, idx) => (
                  <TableRow key={s.student.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {s.student.lastName}
                    </TableCell>
                    <TableCell>{s.student.firstName}</TableCell>
                    <TableCell className="text-center">
                      {s.daysPresent}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.daysAbsent}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          s.presenceRate >= 80
                            ? "border-success text-success"
                            : s.presenceRate >= 50
                              ? "border-warning text-warning-foreground"
                              : "border-destructive text-destructive"
                        }
                      >
                        {s.presenceRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          s.absenteeismRate <= 20
                            ? "border-success text-success"
                            : s.absenteeismRate <= 50
                              ? "border-warning text-warning-foreground"
                              : "border-destructive text-destructive"
                        }
                      >
                        {s.absenteeismRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Global Tab ---
function GlobalTab({
  students,
  records,
  formationStart,
  formationEnd,
}: {
  students: Student[]
  records: AttendanceRecord[]
  formationStart: string
  formationEnd: string
}) {
  const globalStats = useMemo(
    () => getGlobalStats(students, records, formationStart, formationEnd),
    [students, records, formationStart, formationEnd]
  )

  const morningStudents = students.filter((s) => s.classId === "morning").length
  const afternoonStudents = students.filter(
    (s) => s.classId === "afternoon"
  ).length

  const comparisonData = useMemo(
    () => [
      {
        name: "Matin",
        Presence: globalStats.morningStats.averagePresenceRate,
        Absenteisme: globalStats.morningStats.averageAbsenteeismRate,
      },
      {
        name: "Apres-midi",
        Presence: globalStats.afternoonStats.averagePresenceRate,
        Absenteisme: globalStats.afternoonStats.averageAbsenteeismRate,
      },
    ],
    [globalStats]
  )

  const evolutionData = useMemo(() => {
    const morningDays = globalStats.morningStats.dailyStats
    const afternoonDays = globalStats.afternoonStats.dailyStats
    const allDates = new Set([
      ...morningDays.map((d) => d.date),
      ...afternoonDays.map((d) => d.date),
    ])
    const sorted = Array.from(allDates).sort().slice(-20)
    return sorted.map((date) => {
      const m = morningDays.find((d) => d.date === date)
      const a = afternoonDays.find((d) => d.date === date)
      const mRate = m?.rate || 0
      const aRate = a?.rate || 0
      const globalRate =
        morningStudents + afternoonStudents > 0
          ? Math.round(
              ((mRate * morningStudents + aRate * afternoonStudents) /
                (morningStudents + afternoonStudents)) *
                10
            ) / 10
          : 0
      return {
        date: format(new Date(date), "dd MMM", { locale: fr }),
        Global: globalRate,
        Matin: mRate,
        "Apres-midi": aRate,
      }
    })
  }, [globalStats, morningStudents, afternoonStudents])

  const handleExportGlobal = () => {
    exportGlobalSummaryToExcel({
      morningPresenceRate: globalStats.morningStats.averagePresenceRate,
      morningAbsenteeismRate:
        globalStats.morningStats.averageAbsenteeismRate,
      afternoonPresenceRate:
        globalStats.afternoonStats.averagePresenceRate,
      afternoonAbsenteeismRate:
        globalStats.afternoonStats.averageAbsenteeismRate,
      globalPresenceRate: globalStats.globalPresenceRate,
      globalAbsenteeismRate: globalStats.globalAbsenteeismRate,
      morningStudents,
      afternoonStudents,
      totalStudents: globalStats.totalStudents,
      elapsedDays: globalStats.elapsedDays,
      totalDays: globalStats.totalDays,
    })
  }

  const handleExportAll = () => {
    const allStats = [
      ...globalStats.morningStats.studentStats,
      ...globalStats.afternoonStats.studentStats,
    ]
    exportStudentStatsToExcel(allStats, "presence-tous-apprenants")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportGlobal}>
          <Download className="size-4" />
          Resume global
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportAll}>
          <Download className="size-4" />
          Tous les apprenants
        </Button>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Presence Globale"
          value={`${globalStats.globalPresenceRate}%`}
          subtitle="Moyenne des 2 classes"
          icon={UserCheck}
          iconClassName="bg-success/10 text-success"
        />
        <StatsCard
          title="Absenteisme Global"
          value={`${globalStats.globalAbsenteeismRate}%`}
          subtitle="Moyenne des 2 classes"
          icon={TrendingDown}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <StatsCard
          title="Total Apprenants"
          value={globalStats.totalStudents}
          subtitle={`${morningStudents} matin / ${afternoonStudents} apres-midi`}
          icon={Users}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Avancement"
          value={`${globalStats.elapsedDays} / ${globalStats.totalDays} jours`}
          subtitle={`${Math.round((globalStats.elapsedDays / globalStats.totalDays) * 100)}% de la formation`}
          icon={BarChart3}
          iconClassName="bg-chart-5/10 text-chart-5"
        />
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comparaison Matin vs Apres-midi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {globalStats.totalStudents === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Aucune donnee disponible.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparisonData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--card-foreground)",
                  }}
                  formatter={(value: number) => [`${value}%`, undefined]}
                />
                <Legend />
                <Bar
                  dataKey="Presence"
                  fill="var(--color-chart-2)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Absenteisme"
                  fill="var(--color-chart-3)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Global Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Evolution globale du taux de presence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {evolutionData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Aucune donnee disponible.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={evolutionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--card-foreground)",
                  }}
                  formatter={(value: number) => [`${value}%`, undefined]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Global"
                  stroke="var(--color-chart-4)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Matin"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Apres-midi"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume par classe</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead className="text-center">Effectif</TableHead>
                <TableHead className="text-center">Presence (%)</TableHead>
                <TableHead className="text-center">
                  Absenteisme (%)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <Badge className="bg-success text-success-foreground">
                    Matin
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {morningStudents}
                </TableCell>
                <TableCell className="text-center">
                  {globalStats.morningStats.averagePresenceRate}%
                </TableCell>
                <TableCell className="text-center">
                  {globalStats.morningStats.averageAbsenteeismRate}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <Badge className="bg-primary text-primary-foreground">
                    Apres-midi
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {afternoonStudents}
                </TableCell>
                <TableCell className="text-center">
                  {globalStats.afternoonStats.averagePresenceRate}%
                </TableCell>
                <TableCell className="text-center">
                  {globalStats.afternoonStats.averageAbsenteeismRate}%
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell className="font-bold text-foreground">Global</TableCell>
                <TableCell className="text-center font-bold text-foreground">
                  {globalStats.totalStudents}
                </TableCell>
                <TableCell className="text-center font-bold text-foreground">
                  {globalStats.globalPresenceRate}%
                </TableCell>
                <TableCell className="text-center font-bold text-foreground">
                  {globalStats.globalAbsenteeismRate}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Main Page ---
export default function StatistiquesPage() {
  const { data: students = [] } = useSWR("students", fetchStudents, {
    fallbackData: [],
  })
  const { data: records = [] } = useSWR("records", fetchRecords, {
    fallbackData: [],
  })
  const { data: settings } = useSWR("settings", fetchSettings)

  const formStart = settings?.FORMATION_START || FORMATION_START
  const formEnd = settings?.FORMATION_END || FORMATION_END

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Statistiques"
        description="Analysez les taux de presence et d'absenteisme"
      />

      <div className="flex flex-col gap-6 p-4 md:p-6 pb-20 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid grid-cols-3 h-12 w-full md:w-[600px] p-1 bg-muted/50 backdrop-blur-sm border">
            <TabsTrigger 
              value="individual"
              className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="size-4" />
              <span className="hidden sm:inline">Par Apprenant</span>
              <span className="sm:hidden">Appr.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="class"
              className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="size-4" />
              <span className="hidden sm:inline">Par Classe</span>
              <span className="sm:hidden">Classe</span>
            </TabsTrigger>
            <TabsTrigger 
              value="global"
              className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Globe className="size-4" />
              <span className="hidden sm:inline">Global</span>
              <span className="sm:hidden">Global</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="mt-6">
            <IndividualTab students={students} records={records} formationStart={formStart} formationEnd={formEnd} />
          </TabsContent>

          <TabsContent value="class" className="mt-6">
            <ClassTab students={students} records={records} formationStart={formStart} formationEnd={formEnd} />
          </TabsContent>

          <TabsContent value="global" className="mt-6">
            <GlobalTab students={students} records={records} formationStart={formStart} formationEnd={formEnd} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
