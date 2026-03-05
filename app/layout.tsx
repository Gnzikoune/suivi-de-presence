import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { AuthGate } from "@/components/auth-gate"
import { WhatsAppFloat } from "@/components/whatsapp-float"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "Suivi de Presence ",
  description:
    "Outil de suivi de presence pour la formation. Gerez les apprenants, prenez la presence et analysez les statistiques.",
  icons: {
    icon: "/icon.ico",
    apple: "/Logo.png",
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#4338ca",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased text-sm-fluid md:text-base`}>
        <AuthGate>
          {children}
        </AuthGate>
        <Toaster richColors position="top-right" />
        <Analytics />
        <SWRegistration />
        <WhatsAppFloat />
      </body>
    </html>
  )
}

function SWRegistration() {
  const isClient = typeof window !== 'undefined'
  
  if (isClient && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('SW registered: ', registration)
        },
        (err) => {
          console.log('SW registration failed: ', err)
        }
      )
    })
  }
  return null
}
