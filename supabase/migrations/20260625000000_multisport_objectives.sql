ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS obiettivi TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS volume_target JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS obiettivi_pesati JSONB DEFAULT '[]';
