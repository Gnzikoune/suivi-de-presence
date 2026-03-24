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

interface CampusFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string }) => Promise<void>
  loading?: boolean
  initialData?: { name: string }
}

export function CampusForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  initialData,
}: CampusFormProps) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "")
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onSubmit({ name: name.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier le campus" : "Ajouter un campus"}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Modifiez les informations du campus sélectionné." 
              : "Créez un nouveau site géographique pour votre organisation."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du Campus</Label>
            <Input 
              id="name" 
              placeholder="Ex: Campus de Libreville" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
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
              <span>{loading ? "Chargement..." : initialData ? "Enregistrer" : "Créer le campus"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
