-- Ajouter les colonnes de justification à la table records
ALTER TABLE records ADD COLUMN IF NOT EXISTS justification_type text CHECK (justification_type IN ('verbal', 'written'));
ALTER TABLE records ADD COLUMN IF NOT EXISTS justification_text text;
ALTER TABLE records ADD COLUMN IF NOT EXISTS justification_file_path text;

-- Mettre à jour les politiques RLS si nécessaire (généralement non requis si les colonnes sont accessibles par défaut)
COMMENT ON COLUMN records.justification_type IS 'Type de justification : verbal ou écrit';
COMMENT ON COLUMN records.justification_text IS 'Contenu de la justification verbale ou notes';
COMMENT ON COLUMN records.justification_file_path IS 'Chemin vers le fichier de justification dans le storage';
