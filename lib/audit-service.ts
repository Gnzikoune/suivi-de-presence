import { createClient, createAdminClient } from "./supabase-server"

export async function logAudit(
  actorId: string,
  action: string,
  details: string,
  targetType?: string,
  targetId?: string
) {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  
  try {
    // Get actor info from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", actorId)
      .maybeSingle()

    let actorName = profile?.full_name

    // If no name found, try to get email from Auth
    if (!actorName) {
      const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(actorId)
      actorName = authUser?.email || profile?.email || "Utilisateur"
    }

    const { error } = await adminClient
      .from("audit_log")
      .insert({
        actor_id: actorId,
        actor_name: actorName,
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
