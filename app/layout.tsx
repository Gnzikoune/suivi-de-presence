import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { AuthGate } from "@/components/auth-gate"
import { WhatsAppFloat } from "@/components/whatsapp-float"
import { SWRegistration } from "@/components/sw-registration"
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
      <body className={`${outfit.variable} font-sans antialiased text-sm-fluid md:text-base`} suppressHydrationWarning>
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
