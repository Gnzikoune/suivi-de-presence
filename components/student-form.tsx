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
import type { Student, ClassId } from "@/lib/types"

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  onSubmit: (data: {
    firstName: string
    lastName: string
    classId: ClassId
  }) => void
}

export function StudentForm({
  open,
  onOpenChange,
  student,
  onSubmit,
}: StudentFormProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [classId, setClassId] = useState<ClassId>("morning")

  useEffect(() => {
    if (student) {
      setFirstName(student.firstName)
      setLastName(student.lastName)
      setClassId(student.classId)
    } else {
      setFirstName("")
      setLastName("")
      setClassId("morning")
    }
  }, [student, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), classId })
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom de famille"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName">Prenom</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prenom"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="classId">Classe</Label>
            <Select
              value={classId}
              onValueChange={(v) => setClassId(v as ClassId)}
            >
              <SelectTrigger id="classId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Matin (08h30 - 13h00)</SelectItem>
                <SelectItem value="afternoon">
                  Apres-midi (14h00 - 18h30)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {isEditing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
