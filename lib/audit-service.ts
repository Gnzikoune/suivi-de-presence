import { createClient } from "./supabase-server"

export async function logAudit(
  actorId: string,
  action: string,
  details: string,
  targetType?: string,
  targetId?: string
) {
  const supabase = await createClient()
  
  try {
    // Get actor info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", actorId)
      .single()

    const { error } = await supabase
      .from("audit_log")
      .insert({
        actor_id: actorId,
        actor_name: profile?.full_name || "Système",
        action,
        details: { message: details },
        target_type: targetType,
        target_id: targetId,
      })

    if (error) {
      console.error("Audit Logging Error:", error)
    }
  } catch (err) {
    console.error("Audit Service Error:", err)
  }
}
