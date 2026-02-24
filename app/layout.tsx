import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PageShell } from "@/components/page-shell"
import { AnimatePresence } from "framer-motion"
import { AuthGate } from "@/components/auth-gate"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Suivi de Presence - Marketing Digital",
  description:
    "Outil de suivi de presence pour la formation en marketing digital. Gerez les apprenants, prenez la presence et analysez les statistiques.",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthGate>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <AnimatePresence mode="wait">
                <PageShell key="page-shell">
                  {children}
                </PageShell>
              </AnimatePresence>
            </SidebarInset>
          </SidebarProvider>
        </AuthGate>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
