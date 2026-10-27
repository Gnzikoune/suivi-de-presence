"use client"

import { useEffect } from "react"

export function SWRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // In production, or if registered
      const isProd = process.env.NODE_ENV === "production"
      
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js")
          console.log("[PWA] Service Worker registered successfully:", registration.scope)
        } catch (err) {
          console.warn("[PWA] Service Worker registration failed:", err)
        }
      }

      if (document.readyState === "complete") {
        registerSW()
      } else {
        window.addEventListener("load", registerSW)
        return () => window.removeEventListener("load", registerSW)
      }
    }
  }, [])

  return null
}
