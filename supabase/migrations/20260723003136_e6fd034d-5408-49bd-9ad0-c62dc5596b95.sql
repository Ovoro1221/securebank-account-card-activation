
CREATE TABLE public.activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number TEXT NOT NULL UNIQUE,
  cardholder TEXT NOT NULL,
  expiry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','activated')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activations TO anon, authenticated;
GRANT ALL ON public.activations TO service_role;

ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activations_select_all" ON public.activations FOR SELECT USING (true);
CREATE POLICY "activations_insert_all" ON public.activations FOR INSERT WITH CHECK (true);
CREATE POLICY "activations_update_all" ON public.activations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "activations_delete_all" ON public.activations FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.activations;
ALTER TABLE public.activations REPLICA IDENTITY FULL;
