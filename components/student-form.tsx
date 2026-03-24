"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Student, ClassId, Cohort } from "@/lib/types"

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  cohorts: Cohort[]
  onSubmit: (data: {
    firstName: string
    lastName: string
    cohortId: string
    classId?: ClassId
    email?: string
  }) => void
}

export function StudentForm({
  open,
  onOpenChange,
  student,
  cohorts,
  onSubmit,
}: StudentFormProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [cohortId, setCohortId] = useState<string>("")
  const [classId, setClassId] = useState<ClassId>("morning")

  useEffect(() => {
    if (student) {
      setFirstName(student.firstName)
      setLastName(student.lastName)
      setEmail(student.email || "")
      setCohortId(student.cohortId || "")
      setClassId(student.classId)
    } else {
      setFirstName("")
      setLastName("")
      setEmail("")
      setCohortId(cohorts.length > 0 ? cohorts[0].id : "")
      setClassId("morning")
    }
  }, [student, open, cohorts])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !cohortId) return
    onSubmit({ 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      cohortId,
      classId,
      email: email.trim() || undefined 
    })
    onOpenChange(false)
  }

  const isEditing = !!student

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'apprenant" : "Ajouter un apprenant"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de l'apprenant."
              : "Remplissez les informations du nouvel apprenant."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Nom</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nom"
                className="h-9"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
                className="h-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Email (Scan QR)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eleve@exemple.com"
              className="h-9"
            />
            <p className="text-[9px] text-muted-foreground leading-tight italic">
              Indispensable pour le compte personnel et le Scan QR.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cohortId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Cohorte</Label>
              <Select value={cohortId} onValueChange={setCohortId}>
                <SelectTrigger id="cohortId" className="h-9 text-xs">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}{c.campuses?.name ? ` - ${c.campuses.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="classId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Période</Label>
              <Select value={classId} onValueChange={(v) => setClassId(v as ClassId)}>
                <SelectTrigger id="classId" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning" className="text-xs">Matin</SelectItem>
                  <SelectItem value="afternoon" className="text-xs">Après-midi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" className="text-xs font-bold px-6">
              {isEditing ? "Mettre à jour" : "Ajouter l'élève"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
