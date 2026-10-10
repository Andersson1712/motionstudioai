CREATE POLICY "Users read own voiceovers" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voiceovers' AND (storage.foldername(name))[1] = auth.uid()::text);