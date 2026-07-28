/*
# VaultStream — core schema

## Overview
Creates the full data layer for a DoodStream-style video hosting app:
videos, images, folders, clone jobs, view events, and an activity feed.
All owner-scoped with Row Level Security. A public-read channel lets
embed/folder/download pages work without a signed-in viewer.

## 1. New tables
- folders, videos, images, clone_jobs, view_events, activity
## 2. Indexes on owner_id, folder_id, status, privacy, created_at
## 3. Security (RLS)
All tables enable RLS. Owner-scoped CRUD for authenticated users.
Public SELECT for videos/images/folders where privacy='public'.
view_events public read/insert/update (anon embed viewers log joins).
activity owner-scoped only.
## 4. Notes
- owner_id/user_id default to auth.uid().
- Public storage bucket `media` for raw uploads + posters.
- Order: folders first (referenced by videos/images), then the rest.
*/

-- ---------- folders (created first; referenced by videos/images) ----------
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  privacy text NOT NULL DEFAULT 'private'
    CHECK (privacy IN ('public','private')),
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS folders_owner_idx ON folders(owner_id);
CREATE INDEX IF NOT EXISTS folders_parent_idx ON folders(parent_id);

DROP POLICY IF EXISTS "select_own_folders" ON folders;
CREATE POLICY "select_own_folders" ON folders FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_folders" ON folders;
CREATE POLICY "insert_own_folders" ON folders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_folders" ON folders;
CREATE POLICY "update_own_folders" ON folders FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_folders" ON folders;
CREATE POLICY "delete_own_folders" ON folders FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "select_public_folders" ON folders;
CREATE POLICY "select_public_folders" ON folders FOR SELECT
  TO anon, authenticated USING (privacy = 'public');

-- ---------- videos ----------
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  storage_path text,
  size_bytes bigint NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT 'video/mp4',
  poster_url text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','uploading','processing','ready','failed')),
  privacy text NOT NULL DEFAULT 'private'
    CHECK (privacy IN ('public','private')),
  view_count integer NOT NULL DEFAULT 0,
  clone_count integer NOT NULL DEFAULT 0,
  cloned_from uuid REFERENCES videos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS videos_owner_idx ON videos(owner_id);
CREATE INDEX IF NOT EXISTS videos_folder_idx ON videos(folder_id);
CREATE INDEX IF NOT EXISTS videos_status_idx ON videos(status);
CREATE INDEX IF NOT EXISTS videos_privacy_idx ON videos(privacy);
CREATE INDEX IF NOT EXISTS videos_cloned_from_idx ON videos(cloned_from);
CREATE INDEX IF NOT EXISTS videos_created_idx ON videos(created_at DESC);

DROP POLICY IF EXISTS "select_own_videos" ON videos;
CREATE POLICY "select_own_videos" ON videos FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_videos" ON videos;
CREATE POLICY "insert_own_videos" ON videos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_videos" ON videos;
CREATE POLICY "update_own_videos" ON videos FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_videos" ON videos;
CREATE POLICY "delete_own_videos" ON videos FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "select_public_videos" ON videos;
CREATE POLICY "select_public_videos" ON videos FOR SELECT
  TO anon, authenticated USING (privacy = 'public');

-- ---------- images ----------
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  storage_path text,
  size_bytes bigint NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT 'image/jpeg',
  thumbnail_url text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','uploading','processing','ready','failed')),
  privacy text NOT NULL DEFAULT 'private'
    CHECK (privacy IN ('public','private')),
  cloned_from uuid REFERENCES images(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS images_owner_idx ON images(owner_id);
CREATE INDEX IF NOT EXISTS images_folder_idx ON images(folder_id);
CREATE INDEX IF NOT EXISTS images_status_idx ON images(status);
CREATE INDEX IF NOT EXISTS images_privacy_idx ON images(privacy);

DROP POLICY IF EXISTS "select_own_images" ON images;
CREATE POLICY "select_own_images" ON images FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_images" ON images;
CREATE POLICY "insert_own_images" ON images FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_images" ON images;
CREATE POLICY "update_own_images" ON images FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_images" ON images;
CREATE POLICY "delete_own_images" ON images FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "select_public_images" ON images;
CREATE POLICY "select_public_images" ON images FOR SELECT
  TO anon, authenticated USING (privacy = 'public');

-- ---------- clone_jobs ----------
CREATE TABLE IF NOT EXISTS clone_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'url'
    CHECK (source_type IN ('video','image','folder','url')),
  source_ref text NOT NULL,
  target_folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','fetching','processing','done','failed')),
  progress integer NOT NULL DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100),
  result_video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  result_image_id uuid REFERENCES images(id) ON DELETE SET NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE clone_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS clone_jobs_user_status_idx ON clone_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS clone_jobs_created_idx ON clone_jobs(created_at DESC);

DROP POLICY IF EXISTS "select_own_clone_jobs" ON clone_jobs;
CREATE POLICY "select_own_clone_jobs" ON clone_jobs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_clone_jobs" ON clone_jobs;
CREATE POLICY "insert_own_clone_jobs" ON clone_jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_clone_jobs" ON clone_jobs;
CREATE POLICY "update_own_clone_jobs" ON clone_jobs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_clone_jobs" ON clone_jobs;
CREATE POLICY "delete_own_clone_jobs" ON clone_jobs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- view_events ----------
CREATE TABLE IF NOT EXISTS view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);
ALTER TABLE view_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS view_events_video_idx ON view_events(video_id);
CREATE INDEX IF NOT EXISTS view_events_live_idx ON view_events(video_id, left_at);

DROP POLICY IF EXISTS "select_view_events" ON view_events;
CREATE POLICY "select_view_events" ON view_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_view_events" ON view_events;
CREATE POLICY "insert_view_events" ON view_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_view_events" ON view_events;
CREATE POLICY "update_view_events" ON view_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- activity ----------
CREATE TABLE IF NOT EXISTS activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('upload','clone','folder_shared','privacy_changed','rename','delete','folder_created')),
  message text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS activity_user_idx ON activity(user_id, created_at DESC);

DROP POLICY IF EXISTS "select_own_activity" ON activity;
CREATE POLICY "select_own_activity" ON activity FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_activity" ON activity;
CREATE POLICY "insert_own_activity" ON activity FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_activity" ON activity;
CREATE POLICY "update_own_activity" ON activity FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_activity" ON activity;
CREATE POLICY "delete_own_activity" ON activity FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- updated_at triggers ----------
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS videos_touch ON videos;
CREATE TRIGGER videos_touch BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS images_touch ON images;
CREATE TRIGGER images_touch BEFORE UPDATE ON images
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS folders_touch ON folders;
CREATE TRIGGER folders_touch BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS clone_jobs_touch ON clone_jobs;
CREATE TRIGGER clone_jobs_touch BEFORE UPDATE ON clone_jobs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------- storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_insert" ON storage.objects;
CREATE POLICY "media_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_owner_update" ON storage.objects;
CREATE POLICY "media_owner_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_owner_delete" ON storage.objects;
CREATE POLICY "media_owner_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media');
