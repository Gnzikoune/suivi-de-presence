import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const DEFAULT_FORMATIONS = [
  { label: 'Marketing Digital', value: 'marketing_digital' },
  { label: 'Développement Web', value: 'dev_web' },
  { label: 'Digital Creator', value: 'digital_creator' }
]

export async function GET() {
  // Use admin client to ensure public visibility of formations during signup
  const supabase = await createAdminClient()
  try {
    const { data, error } = await supabase
      .from("formations")
      .select("value, label")
      .order("label", { ascending: true })

    if (error) {
      console.warn("DB formations fetch failed, using fallbacks:", error)
      return NextResponse.json(DEFAULT_FORMATIONS)
    }
    
    // If table exists but is empty, use defaults
    if (!data || data.length === 0) {
      return NextResponse.json(DEFAULT_FORMATIONS)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch formations:", error)
    return NextResponse.json(DEFAULT_FORMATIONS)
  }
}
