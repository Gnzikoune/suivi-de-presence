import Airtable from "airtable"

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error("Missing AIRTABLE_API_KEY environment variable")
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error("Missing AIRTABLE_BASE_ID environment variable")
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
)

export const studentsTable = base("Students")
export const attendanceTable = base("Attendance")

export default base
