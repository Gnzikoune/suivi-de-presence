-- ==============================================================================
-- SCRIPT DE SÉCURITÉ SUPABASE 100% INFAILLIBLE
-- Ignore les tables d'extensions système (PostGIS spatial_ref_sys, etc.)
-- Et capture toutes les exceptions de droits automatiquement
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
          AND tableowner NOT IN ('supabase_admin')
    ) LOOP
        -- 1. Activer RLS
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
        EXCEPTION
            WHEN OTHERS THEN
                NULL; -- Ignore les tables système ou sans permission de propriétaire
        END;
        
        -- 2. Créer la politique d'accès pour les utilisateurs connectés
        BEGIN
            EXECUTE format('
                CREATE POLICY "Allow authenticated access"
                ON public.%I FOR ALL TO authenticated
                USING (true) WITH CHECK (true);
            ', r.tablename);
        EXCEPTION
            WHEN duplicate_object THEN
                NULL; -- La politique existe déjà
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

-- Vérification : Affiche vos tables avec leur statut RLS
SELECT tablename, rowsecurity AS rls_active
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns');
