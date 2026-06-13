
CREATE TABLE public.piani_settimanali (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settimana_inizio date NOT NULL,
  giorni jsonb NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, settimana_inizio)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.piani_settimanali TO authenticated;
GRANT ALL ON public.piani_settimanali TO service_role;

ALTER TABLE public.piani_settimanali ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own piani select" ON public.piani_settimanali FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own piani insert" ON public.piani_settimanali FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own piani update" ON public.piani_settimanali FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own piani delete" ON public.piani_settimanali FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER piani_settimanali_updated_at
  BEFORE UPDATE ON public.piani_settimanali
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
