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
import { RefreshCcw, Plus } from "lucide-react"

interface FormationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { label: string; value: string }) => Promise<void>
  loading?: boolean
}

export function FormationForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: FormationFormProps) {
  const [label, setLabel] = useState("")
  const [value, setValue] = useState("")

  useEffect(() => {
    if (!open) {
      setLabel("")
      setValue("")
    }
  }, [open])

  const handleLabelChange = (val: string) => {
    setLabel(val)
    // Auto-generate slug/value from label if value is empty or matches previous slug pattern
    setValue(val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !value.trim()) return
    await onSubmit({ label: label.trim(), value: value.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une formation</DialogTitle>
          <DialogDescription>
            Configurez une nouvelle filière de formation pour l'organisation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="lab">Libellé</Label>
            <Input 
              id="lab" 
              placeholder="Ex: Marketing Digital" 
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="val">Code (Unique)</Label>
            <Input 
              id="val" 
              placeholder="Ex: marketing-digital" 
              value={value}
              onChange={(e) => setValue(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              required
              disabled={loading}
            />
            <p className="text-[10px] text-muted-foreground">
              Utilisé comme identifiant technique. Uniquement lettres, chiffres et tirets.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <RefreshCcw className="size-4 animate-spin" /> : <Plus className="size-4" />}
              <span>{loading ? "Création..." : "Créer la formation"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
