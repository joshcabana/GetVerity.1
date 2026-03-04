
-- Table: spark_reflections
CREATE TABLE public.spark_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  feeling_score integer,
  liked_text text,
  next_time_text text,
  ai_reflection text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(call_id, user_id)
);

ALTER TABLE public.spark_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reflections"
  ON public.spark_reflections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reflections"
  ON public.spark_reflections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections"
  ON public.spark_reflections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Table: chemistry_vault_items
CREATE TABLE public.chemistry_vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  partner_user_id uuid NOT NULL,
  title text,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_notes text,
  reflection_id uuid REFERENCES public.spark_reflections(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(call_id, user_id)
);

ALTER TABLE public.chemistry_vault_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own vault items"
  ON public.chemistry_vault_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own vault items"
  ON public.chemistry_vault_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own vault items"
  ON public.chemistry_vault_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault items"
  ON public.chemistry_vault_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- updated_at trigger for vault items
CREATE TRIGGER update_chemistry_vault_items_updated_at
  BEFORE UPDATE ON public.chemistry_vault_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
