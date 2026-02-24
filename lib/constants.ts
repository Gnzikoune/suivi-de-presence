import type { ClassInfo } from "./types"

export const FORMATION_START = "2026-02-16"
export const FORMATION_END = "2026-08-30"

export const CLASSES: Record<string, ClassInfo> = {
  morning: {
    id: "morning",
    label: "Matin",
    start: "08h30",
    end: "13h00",
  },
  afternoon: {
    id: "afternoon",
    label: "Apres-midi",
    start: "14h00",
    end: "18h30",
  },
}


