"use client"

import { useState, useMemo, useCallback, useEffect, Fragment, useRef } from "react"
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
  TrendingUp,
  GraduationCap,
  MessageSquare,
  FileText
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { fetchStudents, fetchRecords, saveAttendance, fetchProfile, fetchSettings, fetchSessions, createSession, fetchCohorts } from "@/lib/api-service"
import { useSyncQueue } from "@/hooks/use-sync-queue"
import type { Student, ClassId, AttendanceRecord, Session, Cohort } from "@/lib/types"
import { FORMATION_START, FORMATION_END } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { TableSkeleton } from "@/components/table-skeleton"

export default function PresencePage() {
  const { data: profile } = useSWR("profile", fetchProfile)
  const { data: cohorts = [] } = useSWR("cohorts", fetchCohorts)
  const [selectedCohortId, setSelectedCohortId] = useState<string>("all")


  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentClassId, setCurrentClassId] = useState<ClassId>("morning")
  const [statusMap, setStatusMap] = useState<Map<string, { status: string, justification?: string }>>(new Map())
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [rapidMode, setRapidMode] = useState(false)
  
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  
  // Justification Modal State
  const [justificationModalOpen, setJustificationModalOpen] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [tempJustification, setTempJustification] = useState("")

  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate])
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { data: students = [], mutate: mutateStudents, isLoading: isLoadingStudents } = useSWR(
    selectedCohortId !== "all" ? `students?cohortId=${selectedCohortId}` : "students", 
    () => fetchStudents() // Note: Should filter by cohortId if available
  )

  const { isOnline, queue, addToQueue, isSyncing, sync } = useSyncQueue()

  // 1. Sync Session
  useEffect(() => {
    const syncSession = async () => {
      if (selectedCohortId === "all") {
        setCurrentSession(null)
        return
      }

      // Find existing session for this date/class/cohort
      const sessions = await fetchSessions(dateStr)
      let session = sessions.find(s => 
        s.cohortId === selectedCohortId && 
        s.date === dateStr &&
        (s.title === currentClassId || s.startTime?.startsWith(currentClassId === 'morning' ? '08' : '14'))
      )

      if (!session && isOnline) {
        // Create a new session automatically if it doesn't exist
        try {
          session = await createSession({
            cohortId: selectedCohortId,
            date: dateStr,
            title: currentClassId
          })
        } catch (e) {
          console.error("Failed to auto-create session", e)
        }
      }
      setCurrentSession(session || null)
    }
    syncSession()
  }, [selectedCohortId, dateStr, currentClassId, isOnline])

  const loadRecords = async () => {
    let url = `/api/records?date=${dateStr}&classId=${currentClassId}`
    if (currentSession) {
      url += `&sessionId=${currentSession.id}`
    }
    
    const res = await fetch(url)
    if (res.ok) {
      const records: AttendanceRecord[] = await res.json()
      const map = new Map<string, { status: string, justification?: string }>()
      records.forEach(r => {
        map.set(r.studentId, { 
          status: r.status || (r.present ? 'present' : 'absent'),
          justification: r.justificationText
        })
      })
      setStatusMap(map)
    }
  }

  // 2. Load existing records
  useEffect(() => {
    loadRecords()
  }, [dateStr, currentClassId, currentSession])

  const classStudents = useMemo(() => {
    let list = students
    if (selectedCohortId !== "all") {
      list = students.filter(s => s.cohortId === selectedCohortId)
    }
    // Only show students belonging to the current session's period (morning or afternoon)
    list = list.filter(s => s.classId === currentClassId)
    
    return list.sort((a, b) => a.lastName.localeCompare(b.lastName, "fr"))
  }, [students, selectedCohortId, currentClassId])

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return classStudents
    const q = search.toLowerCase()
    return classStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q)
    )
  }, [classStudents, search])

  const toggleStudent = (studentId: string) => {
    setStatusMap((prev) => {
      const next = new Map(prev)
      const current = next.get(studentId)
      
      if (current?.status === 'present') {
        next.set(studentId, { status: 'absent' })
      } else {
        next.set(studentId, { status: 'present' })
        if (rapidMode) {
          setSearch("")
          setTimeout(() => searchInputRef.current?.focus(), 10)
        }
      }
      return next
    })
  }

  const setStudentStatus = (studentId: string, status: string) => {
    setStatusMap((prev) => {
      const next = new Map(prev)
      const existing = next.get(studentId)
      next.set(studentId, { ...existing, status })
      return next
    })

    if (status === 'excused') {
      setEditingStudentId(studentId)
      // Use functional state or a ref if needed, but here statusMap is already updated above
      // For immediate use in modal, we can get it from the map we just updated or the current state
      setTempJustification(statusMap.get(studentId)?.justification || "")
      setJustificationModalOpen(true)
    }
  }

  const handleSaveJustification = () => {
    if (editingStudentId) {
      setStatusMap((prev) => {
        const next = new Map(prev)
        const existing = next.get(editingStudentId)
        if (existing) {
          next.set(editingStudentId, { ...existing, justification: tempJustification })
        }
        return next
      })
    }
    setJustificationModalOpen(false)
    setEditingStudentId(null)
  }

  const selectAll = () => {
    const map = new Map<string, { status: string, justification?: string }>()
    classStudents.forEach(s => map.set(s.id, { status: 'present' }))
    setStatusMap(map)
  }

  const handleSave = async () => {
    if (selectedCohortId === "all") {
      toast.error("Veuillez sélectionner une cohorte pour enregistrer")
      return
    }

    // Save ALL students in the class, not just present ones
    const allStudentsData = classStudents.map(student => {
      const data = statusMap.get(student.id)
      return {
        studentId: student.id,
        status: data?.status || 'absent',
        justificationType: 'verbal',
        justificationText: data?.justification || ""
      }
    })

    setSaving(true)
    try {
      if (!isOnline) {
        addToQueue('ATTENDANCE', { 
          date: dateStr, 
          classId: currentClassId, 
          sessionId: currentSession?.id,
          presentStudentsData: allStudentsData 
        })
        return
      }
      await saveAttendance(dateStr, currentClassId, allStudentsData, currentSession?.id)
      await loadRecords() // Refresh from DB to ensure sync
      toast.success("Présence enregistrée")
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement. Mise en file d'attente.")
      addToQueue('ATTENDANCE', { 
        date: dateStr, 
        classId: currentClassId, 
        sessionId: currentSession?.id,
        presentStudentsData: allStudentsData 
      }, true)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = classStudents.filter((s) => statusMap.get(s.id)?.status === 'present').length
  const lateCount = classStudents.filter((s) => statusMap.get(s.id)?.status === 'late').length
  const excusedCount = classStudents.filter((s) => statusMap.get(s.id)?.status === 'excused').length
  const absentCount = classStudents.length - (presentCount + lateCount + excusedCount)
  const totalCount = classStudents.length

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Prise de Présence"
        description={`${currentClassId === 'morning' ? 'Matin' : 'Après-midi'} - ${format(selectedDate, "dd MMMM yyyy", { locale: fr })}`}
      >
        <div className="flex items-center gap-4 mr-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Présents</span>
            <Badge variant="outline" className="bg-success/5 text-success border-success/20 font-mono text-xs">
              {presentCount} / {totalCount}
            </Badge>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Retards</span>
            <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20 font-mono text-xs">
              {lateCount}
            </Badge>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Absents</span>
            <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 font-mono text-xs">
              {absentCount}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadRecords} title="Actualiser les données">
            <RefreshCw className="size-4" />
          </Button>

          {queue.length > 0 && (
            <Button variant="outline" size="sm" onClick={sync} disabled={!isOnline || isSyncing}>
              <RefreshCw className={cn("size-4 mr-2", isSyncing && "animate-spin")} />
              <span>Sinc. ({queue.length})</span>
            </Button>
          )}

          <Button onClick={handleSave} size="sm" disabled={saving}>
            <Save className={cn("size-4", saving && "animate-spin")} />
            <span>{saving ? "Enregistrement..." : "Enregistrer"}</span>
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 p-4 md:p-6 pb-20 max-w-5xl mx-auto w-full">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cohort Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <GraduationCap className="size-3" /> Cohorte
            </label>
            <Select 
              value={selectedCohortId} 
              onValueChange={setSelectedCohortId}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Choisir une cohorte..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les cohortes</SelectItem>
                {cohorts.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}{c.campuses?.name ? ` - ${c.campuses.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <CalendarIcon className="size-3" /> Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                  <CalendarIcon className="size-4 mr-2" />
                  {format(selectedDate, "dd MMM yyyy", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Session Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Sun className="size-3" /> Session
            </label>
            <Tabs
              value={currentClassId}
              onValueChange={(v) => setCurrentClassId(v as ClassId)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 h-10 w-full p-1 bg-muted/50 backdrop-blur-sm border">
                <TabsTrigger value="morning" className="gap-2">
                  <Sun className="size-4" /> Matin
                </TabsTrigger>
                <TabsTrigger value="afternoon" className="gap-2">
                  <Moon className="size-4" /> Après-midi
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {currentSession && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <CheckCheck className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase">Session Active</p>
                <p className="text-sm font-medium">
                  {currentSession.title} - {(() => {
                    const c = cohorts.find(ch => ch.id === selectedCohortId)
                    return c ? `${c.name}${c.campuses?.name ? ` - ${c.campuses.name}` : ""}` : "-"
                  })()}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-background">
              ID: {currentSession.id.slice(0, 8)}...
            </Badge>
          </div>
        )}

        {/* Students Table */}
        {isLoadingStudents ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border p-4 rounded-xl bg-muted/20 animate-pulse">
               <Skeleton className="size-5 rounded" />
               <Skeleton className="h-5 w-40" />
               <Skeleton className="h-5 w-24 ml-auto" />
            </div>
            <TableSkeleton columns={4} rows={10} />
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">Prés.</TableHead>
                <TableHead>Apprenant</TableHead>
                <TableHead className="hidden md:table-cell">Prénom</TableHead>
                <TableHead className="w-32 text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Aucun apprenant trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const studentData = statusMap.get(student.id)
                  const status = studentData?.status || 'absent'
                  const isPresent = status === 'present' || status === 'late'
                  
                  return (
                    <TableRow 
                      key={student.id} 
                      className={cn("hover:bg-muted/30 transition-colors", isPresent && "bg-primary/5")}
                    >
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={isPresent} 
                          onCheckedChange={() => toggleStudent(student.id)} 
                        />
                      </TableCell>
                      <TableCell className="font-bold">{student.lastName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{student.firstName}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Select 
                            value={status} 
                            onValueChange={(v) => setStudentStatus(student.id, v)}
                          >
                            <SelectTrigger className={cn(
                              "h-7 w-28 text-[10px] font-bold uppercase",
                              status === 'present' && "bg-success/10 text-success border-success/20",
                              status === 'late' && "bg-warning/10 text-warning border-warning/20",
                              status === 'excused' && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                              status === 'absent' && "bg-destructive/10 text-destructive border-destructive/20"
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Présent</SelectItem>
                              <SelectItem value="late">En retard</SelectItem>
                              <SelectItem value="excused">Excusé</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {status === 'excused' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="size-7" 
                              onClick={() => {
                                setEditingStudentId(student.id)
                                setTempJustification(studentData?.justification || "")
                                setJustificationModalOpen(true)
                              }}
                              title={studentData?.justification || "Ajouter une justification"}
                            >
                              <MessageSquare className={cn("size-3", studentData?.justification ? "text-primary" : "text-muted-foreground")} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Justification Modal */}
      <Dialog open={justificationModalOpen} onOpenChange={setJustificationModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Justifier l'absence</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motif de l'absence</label>
              <Textarea
                placeholder="Ex: Malade, rendez-vous médical, problème de transport..."
                value={tempJustification}
                onChange={(e) => setTempJustification(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJustificationModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveJustification}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
