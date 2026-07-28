/*
# increment_video_view_count RPC

## Overview
Atomically increments a video's lifetime view_count by 1.
Called by the embed player when a new view session starts.

## 1. New functions
- `increment_video_view_count(v_id uuid)` → void
  Increments videos.view_count for the given id. SECURITY DEFINER so the
  anon role (an anonymous embed viewer) can call it even though anon
  cannot UPDATE the videos table directly.

## 2. Security
- SECURITY DEFINER, runs as the table owner.
- Only touches the single row matching v_id.
*/

CREATE OR REPLACE FUNCTION increment_video_view_count(v_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE videos SET view_count = view_count + 1 WHERE id = v_id;
$$;

GRANT EXECUTE ON FUNCTION increment_video_view_count(uuid) TO anon, authenticated;
