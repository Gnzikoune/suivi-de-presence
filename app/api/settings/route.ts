import { NextResponse } from "next/server"
import base from "@/lib/airtable"

const settingsTable = base("Settings")

export async function GET() {
  try {
    const records = await settingsTable.select().all()
    const settings: Record<string, string> = {}
    records.forEach(r => {
      const key = r.get("key") as string
      const value = r.get("value") as string
      if (key && value) {
        settings[key] = value
      }
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Fetch settings error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, value, description } = body

    // Check if exists
    const existing = await settingsTable.select({
      filterByFormula: `{key} = '${key}'`
    }).firstPage()

    if (existing.length > 0) {
      await settingsTable.update(existing[0].id, { value, description })
      return NextResponse.json({ success: true, updated: true })
    } else {
      await settingsTable.create({ key, value, description })
      return NextResponse.json({ success: true, created: true })
    }
  } catch (error) {
    console.error("Save settings error:", error)
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 })
  }
}
