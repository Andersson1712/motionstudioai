CREATE TABLE public.render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','rendering','completed','failed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  mp4_path TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.render_jobs TO authenticated;
GRANT ALL ON public.render_jobs TO service_role;
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own renders" ON public.render_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users queue own renders" ON public.render_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'queued' AND progress = 0 AND mp4_path IS NULL);
CREATE POLICY "Users delete own renders" ON public.render_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX render_jobs_user_idx ON public.render_jobs(user_id, created_at DESC);
CREATE POLICY "Users read own renders files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'renders' AND (storage.foldername(name))[1] = auth.uid()::text);