
-- 1. Add sport array to clubs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS sport text[] DEFAULT '{}'::text[];

-- 2. club_eventi
CREATE TABLE IF NOT EXISTS public.club_eventi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  titolo text NOT NULL,
  descrizione text,
  sport text,
  data timestamptz NOT NULL,
  luogo text,
  max_partecipanti int,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_eventi TO authenticated;
GRANT ALL ON public.club_eventi TO service_role;
ALTER TABLE public.club_eventi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view eventi" ON public.club_eventi FOR SELECT TO authenticated USING (public.is_club_member(auth.uid(), club_id));
CREATE POLICY "captain can insert eventi" ON public.club_eventi FOR INSERT TO authenticated WITH CHECK (public.is_club_captain(auth.uid(), club_id));
CREATE POLICY "captain can update eventi" ON public.club_eventi FOR UPDATE TO authenticated USING (public.is_club_captain(auth.uid(), club_id)) WITH CHECK (public.is_club_captain(auth.uid(), club_id));
CREATE POLICY "captain can delete eventi" ON public.club_eventi FOR DELETE TO authenticated USING (public.is_club_captain(auth.uid(), club_id));
CREATE TRIGGER club_eventi_touch BEFORE UPDATE ON public.club_eventi FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. club_messaggi
CREATE TABLE IF NOT EXISTS public.club_messaggi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  testo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.club_messaggi TO authenticated;
GRANT ALL ON public.club_messaggi TO service_role;
ALTER TABLE public.club_messaggi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can read messaggi" ON public.club_messaggi FOR SELECT TO authenticated USING (public.is_club_member(auth.uid(), club_id));
CREATE POLICY "members can write messaggi" ON public.club_messaggi FOR INSERT TO authenticated WITH CHECK (public.is_club_member(auth.uid(), club_id) AND user_id = auth.uid());
CREATE POLICY "author or captain can delete" ON public.club_messaggi FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_club_captain(auth.uid(), club_id));

-- 4. club_partecipazioni
CREATE TABLE IF NOT EXISTS public.club_partecipazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.club_eventi(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stato text NOT NULL DEFAULT 'confermato' CHECK (stato IN ('confermato','in_attesa','declinato')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(evento_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_partecipazioni TO authenticated;
GRANT ALL ON public.club_partecipazioni TO service_role;
ALTER TABLE public.club_partecipazioni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view partecipazioni" ON public.club_partecipazioni FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.club_eventi e WHERE e.id = evento_id AND public.is_club_member(auth.uid(), e.club_id))
);
CREATE POLICY "self insert partecipazione" ON public.club_partecipazioni FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.club_eventi e WHERE e.id = evento_id AND public.is_club_member(auth.uid(), e.club_id))
);
CREATE POLICY "self update partecipazione" ON public.club_partecipazioni FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "self delete partecipazione" ON public.club_partecipazioni FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER club_partecipazioni_touch BEFORE UPDATE ON public.club_partecipazioni FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_messaggi;
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_partecipazioni;
