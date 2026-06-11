
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  eta INTEGER,
  anni_esperienza INTEGER DEFAULT 0,
  sport_primario TEXT,
  sport_secondari TEXT[] DEFAULT '{}',
  obiettivo_tipo TEXT,
  obiettivo_dettaglio TEXT,
  giorni_disponibili TEXT[] DEFAULT '{}',
  limitazioni_fisiche TEXT,
  ruolo TEXT DEFAULT 'atleta',
  club_id UUID,
  onboarding_completato BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Attivita table
CREATE TABLE public.attivita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fonte TEXT DEFAULT 'manuale',
  sport_type TEXT,
  data TIMESTAMPTZ NOT NULL,
  distanza_km REAL,
  durata_min INTEGER,
  pace_media TEXT,
  fc_media INTEGER,
  calorie INTEGER,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  note_utente TEXT,
  strava_activity_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attivita TO authenticated;
GRANT ALL ON public.attivita TO service_role;

ALTER TABLE public.attivita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own activities" ON public.attivita
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_attivita_user_data ON public.attivita(user_id, data DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
