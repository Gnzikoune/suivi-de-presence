"use client"

import { useState, useEffect, useCallback } from "react"
import { saveAttendance, addStudent, updateStudent, deleteStudent } from "@/lib/api-service"
import { toast } from "sonner"
import type { ClassId, Student } from "@/lib/types"

export type SyncActionType = 'ATTENDANCE' | 'ADD_STUDENT' | 'UPDATE_STUDENT' | 'DELETE_STUDENT';

export interface SyncItem {
  id: string
  type: SyncActionType
  payload: any
  timestamp: number
}

const STORAGE_KEY = "suivi_presence_sync_queue"

export function useSyncQueue() {
  const [isOnline, setIsOnline] = useState(true)
  const [queue, setQueue] = useState<SyncItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(STORAGE_KEY)
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue))
      } catch (e) {
        console.error("Failed to parse sync queue", e)
      }
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

    toast.info(`Synchronisation de ${itemsToSync.length} opération(s) en attente...`)

    for (const item of itemsToSync) {
      try {
        switch (item.type) {
          case 'ATTENDANCE':
            await saveAttendance(
              item.payload.date, 
              item.payload.classId, 
              item.payload.presentStudentsData,
              item.payload.sessionId
            )
            break
          case 'ADD_STUDENT':
            await addStudent(
              item.payload.firstName, 
              item.payload.lastName, 
              item.payload.classId
            )
            break
          case 'UPDATE_STUDENT':
            await updateStudent(item.payload.id, item.payload.updates)
            break
          case 'DELETE_STUDENT':
            await deleteStudent(item.payload.id)
            break
        }
      } catch (error) {
        console.error(`Sync failed for item ${item.id} (${item.type}):`, error)
        remainingItems.push(item)
      }
    }

    setQueue(remainingItems)
    setIsSyncing(false)

    if (remainingItems.length === 0) {
      toast.success("Toutes les données sont synchronisées ! ✅")
    } else if (remainingItems.length < itemsToSync.length) {
      toast.warning(`${itemsToSync.length - remainingItems.length} opérations synchronisées, ${remainingItems.length} restantes.`)
    }
  }, [queue, isOnline, isSyncing])

  // Auto sync when back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      sync()
    }
  }, [isOnline])

  const addToQueue = useCallback((type: SyncActionType, payload: any, isServerError = false) => {
    const newItem: SyncItem = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now()
    }
    setQueue(prev => [...prev, newItem])
    
    if (isServerError) {
      toast.error("Erreur de connexion : opération mise en attente. 💾 Elle sera synchronisée automatiquement.")
    } else {
      toast.warning("Mode hors-ligne : opération mise en attente. 💾 Elle sera exécutée dès le retour d'Internet.")
    }
    
    // Auto-sync immediately if we are supposed to be online (retry)
    if (navigator.onLine && !isSyncing) {
      setTimeout(() => sync(), 500)
    }
  }, [sync, isSyncing])

  return {
    isOnline,
    queue,
    isSyncing,
    addToQueue,
    sync
  }
}
