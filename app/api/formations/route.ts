import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  // Use createClient but realize that even without a session, 
  // we might want anyone to see the list of formations for signup.
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from("formations")
      .select("value, label")
      .order("label", { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch formations:", error)
    return NextResponse.json({ error: "Failed to fetch formations" }, { status: 500 })
  }
}
