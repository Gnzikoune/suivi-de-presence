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

    // --- 1. Ensure a profile row exists ---
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      // Profile doesn't exist yet — create it with all known info
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          role: metadata.role || "coach",
          full_name: metaFullName,
          email: user.email,
          formation: metaFormation || null,
          orga_name: metaOrga || null,
        })
        .select()
        .single()

      if (createError) {
        console.error("Profile creation error:", createError)
      } else {
        profile = newProfile
        // Log the creation
        await logAudit(user.id, 'SIGNUP', `Création du compte via inscription`, 'profile', user.id)
      }
    } else if (profile) {
      // Profile exists — check for missing data and sync from metadata if needed
      const updates: any = {}
      if (metaFullName && !profile.full_name) updates.full_name = metaFullName
      if (user.email && !profile.email) updates.email = user.email
      // Use metaFormation/metaOrga if present to fill missing DB fields
      if (metaFormation && !profile.formation) updates.formation = metaFormation
      if (metaOrga && !profile.orga_name) updates.orga_name = metaOrga

      if (Object.keys(updates).length > 0) {
        const { data: updated } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single()
        if (updated) profile = updated
      }
    }

    // --- 2. Fetch formation label from 'formations' table if exists ---
    let formationLabel = ""
    if (profile?.formation) {
      const { data: fData } = await supabase
        .from("formations")
        .select("label")
        .eq("value", profile.formation)
        .single()
      
      formationLabel = fData?.label || profile.formation
    }

    return NextResponse.json({ 
      ...(profile || {}), 
      email: user.email,
      formation_label: formationLabel
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
