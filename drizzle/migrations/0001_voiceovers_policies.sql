CREATE POLICY "Users upload own voiceovers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voiceovers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own voiceovers" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'voiceovers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own voiceovers" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'voiceovers' AND (storage.foldername(name))[1] = auth.uid()::text);