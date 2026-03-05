"use client"

import { useState } from "react"
import useSWR from "swr"
import { 
  Users, 
  BarChart3, 
  TrendingUp,
  BookOpen
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    const info = await res.json()
    ;(error as any).info = info
    ;(error as any).status = res.status
    throw error
  }
  return res.json()
}

export default function CampusManagerPage() {
  const [selectedFormation, setSelectedFormation] = useState("all")
  const { data: stats } = useSWR(`/api/campus-manager/overview?formation=${selectedFormation}`, fetcher)
  const { data: formations } = useSWR("/api/super-admin/formations", fetcher)

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Vue Campus Manager" 
        description="Vue globale de l'assiduité par formation et par campus."
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Filtrer :</span>
          <select 
            className="text-xs bg-background border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary min-w-[150px]"
            value={selectedFormation}
            onChange={(e) => setSelectedFormation(e.target.value)}
          >
            <option value="all">Toutes les cohortes</option>
            {formations?.map((f: any) => (
              <option key={f.id} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Apprenants Totaux</p>
                  <h3 className="text-3xl font-bold tracking-tight">{stats?.totalStudents || 0}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Users className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Présence Moyenne</p>
                  <h3 className="text-3xl font-bold tracking-tight">{stats?.globalPresenceRate || 0}%</h3>
                </div>
                <div className="p-3 bg-success/10 rounded-xl text-success">
                  <TrendingUp className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-info/5 border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Formations Suivies</p>
                  <h3 className="text-3xl font-bold tracking-tight">{stats?.statsByFormation?.length || 0}</h3>
                </div>
                <div className="p-3 bg-info/10 rounded-xl text-info">
                  <BookOpen className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            Répartition par Formation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.statsByFormation?.map((f: any, i: number) => (
              <motion.div
                key={f.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{f.label}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-muted rounded-full">
                        {f.count} apprenants
                      </span>
                    </div>
                    <Progress value={Math.min(100, (f.count / (stats?.totalStudents || 1)) * 100)} className="h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
