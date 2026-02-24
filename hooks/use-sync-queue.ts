"use client"

import { useState, useEffect, useCallback } from "react"
import { saveAttendance } from "@/lib/api-service"
import { toast } from "sonner"

interface SyncItem {
  id: string
  date: string
  classId: string
  presentStudentsData: { studentId: string, arrivalTime: string }[]
  timestamp: number
}

const STORAGE_KEY = "attendance_sync_queue"

export function useSyncQueue() {
  const [isOnline, setIsOnline] = useState(true)
  const [queue, setQueue] = useState<SyncItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(STORAGE_KEY)
    if (savedQueue) {
      setQueue(JSON.parse(savedQueue))
    }

    // Network listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    
    // Initial state
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  }, [queue])

  const sync = useCallback(async () => {
    if (queue.length === 0 || !isOnline || isSyncing) return

    setIsSyncing(true)
    const itemsToSync = [...queue]
    const remainingItems: SyncItem[] = []

    toast.info(`Synchronisation de ${itemsToSync.length} session(s) en attente...`)

    for (const item of itemsToSync) {
      try {
        await saveAttendance(item.date, item.classId as any, item.presentStudentsData)
      } catch (error) {
        console.error("Sync failed for item:", item, error)
        remainingItems.push(item)
      }
    }

    setQueue(remainingItems)
    setIsSyncing(false)

    if (remainingItems.length === 0) {
      toast.success("Toutes les données sont synchronisées ! ✅")
    } else {
      toast.error(`${remainingItems.length} session(s) n'ont pas pu être synchronisées.`)
    }
  }, [queue, isOnline, isSyncing])

  // Auto sync when back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      sync()
    }
  }, [isOnline])

  const addToQueue = useCallback((date: string, classId: string, presentStudentsData: { studentId: string, arrivalTime: string }[]) => {
    const newItem: SyncItem = {
      id: crypto.randomUUID(),
      date,
      classId,
      presentStudentsData,
      timestamp: Date.now()
    }
    setQueue(prev => [...prev, newItem])
    toast.warning("Mode hors-ligne : données enregistrées localement. 💾 Elles seront envoyées dès le retour d'Internet.")
  }, [])

  return {
    isOnline,
    queue,
    isSyncing,
    addToQueue,
    sync
  }
}
