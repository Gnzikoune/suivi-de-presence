"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { format, isWeekend, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarIcon,
  Search,
  CheckCircle2,
  Save,
  CheckCheck,
  XCircle,
  Sun,
  Moon,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { fetchStudents, fetchRecords, saveAttendance } from "@/lib/api-service"
import type { Student, ClassId, AttendanceRecord } from "@/lib/types"
import { FORMATION_START, FORMATION_END } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function PresencePage() {
  const { data: students = [] } = useSWR("students", fetchStudents)
  const { data: records = [] } = useSWR("records", fetchRecords)

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedClass, setSelectedClass] = useState<ClassId>("morning")
  const [presenceMap, setPresenceMap] = useState<Map<string, string>>(new Map())
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const dateStr = format(selectedDate, "yyyy-MM-dd")
  const isWeekendDay = isWeekend(selectedDate)

  // Load existing attendance when date/class/records change
  useEffect(() => {
    const existing = records.filter(
      (r) => r.date === dateStr && r.classId === selectedClass
    )
    if (existing.length > 0) {
      const map = new Map<string, string>()
      existing.forEach((r) => {
        if (r.present) {
          map.set(r.studentId, r.arrivalTime || format(new Date(), "HH:mm"))
        }
      })
      setPresenceMap(map)
    } else {
      setPresenceMap(new Map())
    }
  }, [dateStr, selectedClass, records])

  // Class students for selected class
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClass)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr"))
  }, [students, selectedClass])

  // Filter by search
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return classStudents
    const q = search.toLowerCase()
    return classStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q)
    )
  }, [classStudents, search])

  const alreadySaved = useMemo(() => {
    return records.some((r) => r.date === dateStr && r.classId === selectedClass)
  }, [records, dateStr, selectedClass])

  const toggleStudent = (studentId: string) => {
    setPresenceMap((prev) => {
      const next = new Map(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.set(studentId, format(new Date(), "HH:mm"))
      }
      return next
    })
  }

  const selectAll = () => {
    const time = format(new Date(), "HH:mm")
    const map = new Map<string, string>()
    classStudents.forEach(s => map.set(s.id, time))
    setPresenceMap(map)
  }

  const deselectAll = () => {
    setPresenceMap(new Map())
  }

  const handleSave = async () => {
    if (isWeekendDay) {
      toast.error("Impossible de saisir la présence un jour de week-end")
      return
    }
    setSaving(true)
    try {
      const presentStudentsData = Array.from(presenceMap.entries()).map(([studentId, arrivalTime]) => ({
        studentId,
        arrivalTime
      }))
      
      await saveAttendance(dateStr, selectedClass, presentStudentsData)
      await mutate("records")
      toast.success(
        `Présence enregistrée pour le ${format(selectedDate, "dd MMMM yyyy", { locale: fr })} - ${selectedClass === "morning" ? "Matin" : "Après-midi"}`
      )
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const presentCount = classStudents.filter((s) => presenceMap.has(s.id)).length
  const totalCount = classStudents.length

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Prise de Présence"
        description={`${format(selectedDate, "EEEE dd MMMM yyyy", { locale: fr })}`}
      >
        <Button onClick={handleSave} size="sm" disabled={isWeekendDay || totalCount === 0 || saving}>
          <Save className={cn("size-4", saving && "animate-spin")} />
          <span>{saving ? "Enregistrement..." : "Enregistrer"}</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-4 md:p-6 pb-20 max-w-5xl mx-auto w-full">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    isWeekendDay && "border-destructive text-destructive"
                  )}
                >
                  <CalendarIcon className="size-4" />
                  <span className="hidden sm:inline">
                    {format(selectedDate, "dd MMM yyyy", { locale: fr })}
                  </span>
                  <span className="sm:hidden">
                    {format(selectedDate, "dd/MM", { locale: fr })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  disabled={(date) =>
                    isWeekend(date) ||
                    date < parseISO(FORMATION_START) ||
                    date > parseISO(FORMATION_END)
                  }
                  locale={fr}
                />
              </PopoverContent>
            </Popover>

            {/* Class Selector */}
            <Tabs
              value={selectedClass}
              onValueChange={(v) => setSelectedClass(v as ClassId)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-2 h-10 w-full sm:w-[300px] p-1 bg-muted/50 backdrop-blur-sm border">
                <TabsTrigger 
                  value="morning" 
                  className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Sun className="size-3.5" />
                  <span>Matin</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="afternoon" 
                  className="gap-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Moon className="size-3.5" />
                  <span>Après-midi</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Badge */}
            {alreadySaved ? (
              <Badge
                variant="outline"
                className="border-success text-success"
              >
                <CheckCircle2 className="mr-1 size-3" />
                Déjà saisie
              </Badge>
            ) : (
              <Badge variant="outline" className="border-warning text-warning-foreground">
                Non saisie
              </Badge>
            )}
          </div>
        </div>

        {isWeekendDay && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
            Cette date tombe un week-end. La présence ne peut pas être saisie.
          </div>
        )}

        {!isWeekendDay && (
          <>
            {/* Counter + Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground text-base md:text-lg">
                    {presentCount}
                  </span>{" "}
                  / {totalCount} présents
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    className="h-8 text-[10px] sm:text-xs px-2"
                  >
                    <CheckCheck className="mr-1 size-3 sm:size-3.5" />
                    Tous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    className="h-8 text-[10px] sm:text-xs px-2"
                  >
                    <XCircle className="mr-1 size-3 sm:size-3.5" />
                    Aucun
                  </Button>
                </div>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Attendance Table */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-10 px-2 sm:px-4">Prés.</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Apprenant</TableHead>
                    <TableHead className="hidden md:table-cell px-2 sm:px-4">Prénom</TableHead>
                    <TableHead className="px-2 sm:px-4 text-xs sm:text-sm text-center">Arrivée</TableHead>
                    <TableHead className="w-20 text-center px-2 sm:px-4 text-xs sm:text-sm">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {classStudents.length === 0
                          ? "Aucun apprenant dans cette classe."
                          : "Aucun résultat trouvé."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const isPresent = presenceMap.has(student.id)
                      const arrivalTime = presenceMap.get(student.id)
                      
                      return (
                        <TableRow
                          key={student.id}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/20 active:bg-muted/40",
                            isPresent && "bg-success/5"
                          )}
                          onClick={() => toggleStudent(student.id)}
                        >
                          <TableCell className="px-2 sm:px-4">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={isPresent}
                                onCheckedChange={() =>
                                  toggleStudent(student.id)
                                }
                                className="size-5 md:size-4"
                                aria-label={`Marquer ${student.firstName} ${student.lastName} comme présent`}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-2 sm:px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs sm:text-sm">{student.lastName}</span>
                              <span className="text-[10px] sm:text-xs font-normal text-muted-foreground md:hidden">
                                {student.firstName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell px-2 sm:px-4">
                            {student.firstName}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 text-center">
                            {isPresent ? (
                              <span className="text-xs font-mono font-medium text-success dark:text-success/90 bg-success/10 px-2 py-0.5 rounded border border-success/20">
                                {arrivalTime}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">--:--</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center px-2 sm:px-4">
                            {isPresent ? (
                              <Badge className="bg-success text-success-foreground hover:bg-success/90 text-[10px] sm:text-xs">
                                Présent
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground text-[10px] sm:text-xs"
                              >
                                Absent
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
