/*
# Seed sample content for test users

## Overview
Populates videos, images, folders, and activity for the creator account,
plus one public folder with a couple public videos so the viewer account
(and unauthenticated visitors) can see shared content and test cloning.

## 1. Data seeded
- creator: 2 folders (1 public "Travel Vlogs", 1 private "Drafts"),
  6 videos (mixed statuses/privacy/view counts), 2 images, 4 activity entries
- viewer: 1 folder, 1 video
- 1 public folder "Featured Content" owned by creator with 2 public videos

## 2. Idempotent
Uses ON CONFLICT DO NOTHING so re-running won't duplicate.
*/

DO $$
DECLARE
  creator_id uuid := 'ba00ce1f-e8cc-4014-8001-ebcc60fa4eda';
  viewer_id  uuid := '557c20dd-d1f6-477c-83ae-84e46714daeb';
  travel_folder uuid;
  drafts_folder uuid;
  featured_folder uuid;
  viewer_folder uuid;
  v1 uuid; v2 uuid; v3 uuid; v4 uuid; v5 uuid; v6 uuid;
  fv1 uuid; fv2 uuid;
  im1 uuid; im2 uuid;
  vv1 uuid;
BEGIN
  -- ---------- creator folders ----------
  INSERT INTO folders (id, owner_id, name, privacy)
  VALUES (gen_random_uuid(), creator_id, 'Travel Vlogs', 'public')
  ON CONFLICT DO NOTHING
  RETURNING id INTO travel_folder;

  INSERT INTO folders (id, owner_id, name, privacy)
  VALUES (gen_random_uuid(), creator_id, 'Drafts', 'private')
  ON CONFLICT DO NOTHING
  RETURNING id INTO drafts_folder;

  INSERT INTO folders (id, owner_id, name, privacy)
  VALUES (gen_random_uuid(), creator_id, 'Featured Content', 'public')
  ON CONFLICT DO NOTHING
  RETURNING id INTO featured_folder;

  -- ---------- creator videos ----------
  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), creator_id, travel_folder, 'Sunset Over Santorini',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     184000000, 'video/mp4',
     'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'ready', 'public', 1247, 23, now() - interval '6 days')
  ON CONFLICT DO NOTHING RETURNING id INTO v1;

  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), creator_id, travel_folder, 'Tokyo Street Food Tour',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     320000000, 'video/mp4',
     'https://images.pexels.com/photos/3129957/pexels-photo-3129957.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'ready', 'public', 892, 15, now() - interval '5 days')
  ON CONFLICT DO NOTHING RETURNING id INTO v2;

  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), creator_id, drafts_folder, 'Drone Footage — Iceland Raw Cut',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     512000000, 'video/mp4',
     'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'processing', 'private', 0, 0, now() - interval '2 hours')
  ON CONFLICT DO NOTHING RETURNING id INTO v3;

  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), creator_id, NULL, 'Product Demo — Wireless Earbuds',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     96000000, 'video/mp4',
     'https://images.pexels.com/photos/3573555/pexels-photo-3573555.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'ready', 'public', 3401, 47, now() - interval '3 days')
  ON CONFLICT DO NOTHING RETURNING id INTO v4;

  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), creator_id, drafts_folder, 'Interview B-Roll — Unedited',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     78000000, 'video/mp4',
     'https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'queued', 'private', 0, 0, now() - interval '10 minutes')
  ON CONFLICT DO NOTHING RETURNING id INTO v5;

  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), creator_id, NULL, 'Cooking Pasta from Scratch',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     142000000, 'video/mp4',
     'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'failed', 'private', 0, 0, now() - interval '1 day')
  ON CONFLICT DO NOTHING RETURNING id INTO v6;

  -- ---------- featured folder videos (public, for shared/cloning demo) ----------
  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), creator_id, featured_folder, 'Mountain Timelapse — Dolomites',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     64000000, 'video/mp4',
     'https://images.pexels.com/photos/364026/pexels-photo-364026.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'ready', 'public', 5621, 89, now() - interval '8 days')
  ON CONFLICT DO NOTHING RETURNING id INTO fv1;

  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), creator_id, featured_folder, 'Ocean Waves — Relaxation Loop',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     38000000, 'video/mp4',
     'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'ready', 'public', 1893, 31, now() - interval '7 days')
  ON CONFLICT DO NOTHING RETURNING id INTO fv2;

  -- ---------- creator images ----------
  INSERT INTO images (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, thumbnail_url, status, privacy, created_at)
  VALUES
    (gen_random_uuid(), creator_id, travel_folder, 'Santorini Landscape',
     'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400',
     2400000, 'image/jpeg',
     'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400',
     'ready', 'public', now() - interval '4 days')
  ON CONFLICT DO NOTHING RETURNING id INTO im1;

  INSERT INTO images (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, thumbnail_url, status, privacy, created_at)
  VALUES
    (gen_random_uuid(), creator_id, NULL, 'Studio Product Shot',
     'https://images.pexels.com/photos/1366913/pexels-photo-1366913.jpeg?auto=compress&cs=tinysrgb&w=400',
     1800000, 'image/jpeg',
     'https://images.pexels.com/photos/1366913/pexels-photo-1366913.jpeg?auto=compress&cs=tinysrgb&w=400',
     'ready', 'private', now() - interval '2 days')
  ON CONFLICT DO NOTHING RETURNING id INTO im2;

  -- ---------- creator activity ----------
  INSERT INTO activity (user_id, type, message, created_at) VALUES
    (creator_id, 'upload',      'Uploaded video "Sunset Over Santorini"',   now() - interval '6 days'),
    (creator_id, 'upload',      'Uploaded video "Tokyo Street Food Tour"',   now() - interval '5 days'),
    (creator_id, 'folder_shared', 'Shared folder "Featured Content"',         now() - interval '8 days'),
    (creator_id, 'clone',       'Cloned video from external link',            now() - interval '3 days'),
    (creator_id, 'upload',      'Uploaded video "Product Demo — Wireless Earbuds"', now() - interval '3 days'),
    (creator_id, 'privacy_changed', 'Made "Product Demo" public',             now() - interval '2 days')
  ON CONFLICT DO NOTHING;

  -- ---------- viewer content ----------
  INSERT INTO folders (id, owner_id, name, privacy)
  VALUES (gen_random_uuid(), viewer_id, 'My Collection', 'private')
  ON CONFLICT DO NOTHING RETURNING id INTO viewer_folder;

  INSERT INTO videos (id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, created_at)
  VALUES
    (gen_random_uuid(), viewer_id, viewer_folder, 'My First Upload',
     'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
     42000000, 'video/mp4',
     'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop',
     'ready', 'private', 12, 0, now() - interval '1 day')
  ON CONFLICT DO NOTHING RETURNING id INTO vv1;

  INSERT INTO activity (user_id, type, message, created_at) VALUES
    (viewer_id, 'upload', 'Uploaded video "My First Upload"', now() - interval '1 day')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seeding complete';
END $$;
