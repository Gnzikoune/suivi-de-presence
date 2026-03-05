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
import { RefreshCcw, ShieldCheck } from "lucide-react"

interface InviteUserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { email: string; role: string; full_name: string; formation?: string }) => Promise<void>
  loading?: boolean
  formations?: any[]
}

export function InviteUserForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  formations = []
}: InviteUserFormProps) {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("coach")
  const [formation, setFormation] = useState<string>("")

  useEffect(() => {
    if (!open) {
      setEmail("")
      setFullName("")
      setRole("coach")
      setFormation("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !fullName.trim() || !role) return
    await onSubmit({ 
      email: email.trim(), 
      full_name: fullName.trim(), 
      role, 
      formation: formation || undefined 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Envoyez une invitation par e-mail pour rejoindre l'équipe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Nom Complet</Label>
              <Input 
                id="inviteName" 
                placeholder="Prénom Nom" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">E-mail professionnel</Label>
              <Input 
                id="inviteEmail" 
                type="email" 
                placeholder="adresse@domaine.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach / Formateur</SelectItem>
                  <SelectItem value="campus_manager">Campus Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formation affectée</Label>
              <Select value={formation} onValueChange={setFormation} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Non spécifiée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {Array.isArray(formations) && formations.map((f: any) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <RefreshCcw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              <span>{loading ? "Envoi..." : "Envoyer l'invitation"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
