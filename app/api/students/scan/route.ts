import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function POST(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { sessionId, pin } = body

    let finalSessionId = sessionId

    // --- PIN VALIDATION (IF PROVIDED) ---
    if (pin) {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      
      const { data: codeData } = await supabase
        .from("session_codes")
        .select("session_id")
        .eq("code", pin)
        .gte("created_at", tenMinsAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!codeData) {
        return NextResponse.json({ error: "Code invalide ou expiré." }, { status: 400 })
      }
      finalSessionId = codeData.session_id
    }
    // --- END PIN VALIDATION ---

    if (!finalSessionId) {
      return NextResponse.json({ error: "Identifiant de session manquant." }, { status: 400 })
    }

    // 1. Get student profile
    const { data: student } = await supabase
      .from("students")
      .select("id, cohort_id, orga_name")
      .eq("user_id", user.id)
      .single()

    if (!student) {
      return NextResponse.json({ error: "Profil étudiant non trouvé." }, { status: 404 })
    }

    // 2. Verify student belongs to the cohort of the session
    const { data: session } = await supabase
      .from("sessions")
      .select("id, cohort_id, date")
      .eq("id", finalSessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée." }, { status: 404 })
    }

    if (session.cohort_id !== student.cohort_id) {
       // Allow scanning if the student has no cohort yet (legacy) OR if it's the right cohort
       if (student.cohort_id) {
         return NextResponse.json({ error: "Vous n'appartenez pas à la cohorte de cette session." }, { status: 403 })
       }
    }

    // 3. Enregistrement du pointage (UPSERT)
    const { error } = await supabase
      .from("records")
      .upsert({
        student_id: student.id,
        session_id: finalSessionId,
        present: true,
        status: 'present',
        date: session.date, // Redundant but good for legacy queries
        orga_name: student.orga_name // Redundant but good for legacy queries
      }, {
        onConflict: 'session_id,student_id'
      })

    if (error) throw error

    // Log audit
    await logAudit(user.id, 'QR_SCAN', `Pointage QR réussi pour la session ${finalSessionId}`, 'attendance', finalSessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("QR Scan API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
