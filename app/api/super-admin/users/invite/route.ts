import { createClient, createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function POST(req: Request) {
  const supabase = await createClient()
  
  try {
    // 1. Verify that the requester is an authenticated Super Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single()

    if (!adminProfile || !['super_admin', 'campus_manager'].includes(adminProfile.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // 2. Parse request body
    const { email, role, full_name, formation } = await req.json()
    if (!email || !role) {
      return NextResponse.json({ error: "Email et rôle requis" }, { status: 400 })
    }

    // 2b. Fetch formation label if provided
    let formationLabel = ""
    if (formation && formation !== 'none') {
      const { data: fData } = await supabase
        .from("formations")
        .select("label")
        .eq("value", formation)
        .single()
      formationLabel = fData?.label || ""
    }

    // 3. Use Admin Client to invite the user
    const adminClient = await createAdminClient()
    
    // Invite the user
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { 
        role: role,
        full_name: full_name || "",
        formation: formation || "",
        formation_label: formationLabel,
        needs_password_update: true
      },
      redirectTo: `${req.headers.get('origin') || 'https://suivi-de-presence.vercel.app'}/update-password`
    })

    if (inviteError) {
      console.error("Invitation error:", inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    const newUser = inviteData.user

    // 4. Ensure the profile is set with the correct role and formation
    // Using regular client — Admins have 'ALL' policy on profiles in SQL script
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: newUser.id,
        email: email,
        full_name: full_name || "",
        role: role,
        formation: formation || "",
        formation_label: formationLabel,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error("Profile sync error after invitation:", profileError)
      // We don't fail the whole request because the user IS invited
    }

    // 5. Log the administrative action
    await logAudit(
      user.id,
      'INVITE_USER',
      `Invitation envoyée à ${email} avec le rôle ${role}`,
      'profile',
      newUser.id
    )

    return NextResponse.json({ 
      success: true, 
      user: newUser 
    })

  } catch (error) {
    console.error("Invite API error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
