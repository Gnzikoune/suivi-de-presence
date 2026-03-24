import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-service"

export async function GET() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Extract metadata — support all key variants
    const metadata = user.user_metadata || {}
    const metaFullName = metadata.full_name || ""
    const metaFormation = metadata.formation_name || metadata.formation || ""
    const metaOrga = metadata.orga_name || ""

    // --- 1. Ensure a profile row exists (Identity) ---
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: metaFullName,
          email: user.email,
          formation: metaFormation // Sync formation from metadata
        })
        .select()
        .single()
      profile = newProfile
    } else if (profile && !profile.formation && metaFormation) {
      // Sync formation if empty for existing profile
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .update({ formation: metaFormation })
        .eq("id", user.id)
        .select()
        .single()
      if (updatedProfile) profile = updatedProfile
    }

    // --- 2. Sync Organization & Membership (Architecture Refactor) ---
    if (metaOrga) {
      // Find or create organization
      let { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", metaOrga)
        .single()

      if (!org) {
        const { data: newOrg } = await supabase
          .from("organizations")
          .insert({ name: metaOrga })
          .select()
          .single()
        org = newOrg
      }

      if (org) {
        // Find or create membership
        const userRole = metadata.role || "coach"
        const { data: existingMember } = await supabase
          .from("memberships")
          .select("*")
          .eq("user_id", user.id)
          .eq("org_id", org.id)
          .single()

        if (!existingMember) {
          await supabase
            .from("memberships")
            .insert({
              user_id: user.id,
              org_id: org.id,
              role: userRole
            })
        }
      }
    }

    // --- 3. Return aggregated data for UI compatibility ---
    const { data: memberships } = await supabase
      .from("memberships")
      .select(`
        role,
        organizations (id, name),
        campuses (id, name)
      `)
      .eq("user_id", user.id)

    // Check if user is super_admin in global profile or any membership
    const isSuperAdmin = profile?.role === 'super_admin' || memberships?.some(m => m.role === 'super_admin')
    
    // For compatibility with V1 UI, we pick the first membership as "current"
    const primaryMember = memberships?.[0]
    
    return NextResponse.json({ 
      id: user.id,
      full_name: profile?.full_name || metaFullName,
      email: user.email,
      role: isSuperAdmin ? 'super_admin' : (primaryMember?.role || metadata.role || "coach"),
      orga_name: (primaryMember as any)?.organizations?.name || metaOrga || "Ma Formation",
      org_id: (primaryMember as any)?.organizations?.id,
      formation: profile?.formation || metaFormation, // Include formation in response
      memberships: memberships || []
    })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { full_name, formation, orga_name } = body

    const updates: any = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (formation !== undefined) updates.formation = formation
    if (orga_name !== undefined) updates.orga_name = orga_name

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error

    // Log action
    await logAudit(user.id, 'UPDATE_PROFILE', `Mise à jour du profil par l'utilisateur`, 'profile', user.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
