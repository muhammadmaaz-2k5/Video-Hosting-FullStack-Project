-- Allow anyone (anon + authenticated) to read any video or image for embedding
-- INSERT/UPDATE/DELETE remain restricted to owners only

DROP POLICY IF EXISTS "public_read_videos" ON videos;
CREATE POLICY "public_read_videos" ON videos
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_images" ON images;
CREATE POLICY "public_read_images" ON images
  FOR SELECT TO anon, authenticated USING (true);
