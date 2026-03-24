"use client"

import { useState, useRef } from "react"
import { ImagePlus, Loader2, X, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-browser"

interface LogoUploadProps {
  currentLogoUrl?: string
  onUploadSuccess: (url: string) => void
}

export function LogoUpload({ currentLogoUrl, onUploadSuccess }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image valide.")
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("L'image est trop lourde (max 2Mo).")
      return
    }

    setUploading(true)
    
    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await supabase.storage
        .from('branding') // Assuming 'branding' bucket exists
        .upload(filePath, file)

      if (error) {
        if (error.message.includes("bucket not found")) {
          toast.error("Bucket 'branding' non trouvé sur Supabase. Veuillez le créer.")
        } else {
          toast.error("Erreur lors de l'upload vers Supabase Storage")
        }
        setPreviewUrl(currentLogoUrl || null)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath)

      onUploadSuccess(publicUrl)
      toast.success("Logo mis à jour avec succès")
    } catch (err) {
      toast.error("Une erreur inattendue est survenue")
      setPreviewUrl(currentLogoUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onUploadSuccess("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="size-24 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
            {previewUrl ? (
              <img src={previewUrl} alt="Logo preview" className="size-full object-contain p-2" />
            ) : (
              <ImagePlus className="size-8 text-muted-foreground/40" />
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          {previewUrl && !uploading && (
            <button 
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold">Logo de l'Organisation</h4>
          <p className="text-[11px] text-muted-foreground leading-snug max-w-[200px]">
            PNG, JPG ou SVG. Taille recommandée : 512x512px. Max 2Mo.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadCloud className="size-3.5" />
            {previewUrl ? "Changer le logo" : "Choisir un fichier"}
          </Button>
        </div>
      </div>
    </div>
  )
}
