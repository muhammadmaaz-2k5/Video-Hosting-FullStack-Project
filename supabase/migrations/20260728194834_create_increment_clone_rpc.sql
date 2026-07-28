/*
# increment_clone_count RPC

## Overview
Atomically increments a video's clone_count by 1. Called when a user
clones an internal (link-resolved) video into their own account.

## 1. New functions
- `increment_clone_count(v_id uuid)` → void
  Increments videos.clone_count for the given id. SECURITY DEFINER so
  authenticated users can bump the counter on a public source video
  without needing UPDATE rights on the videos table.

## 2. Security
- SECURITY DEFINER, runs as table owner. Only touches the matching row.
*/

CREATE OR REPLACE FUNCTION increment_clone_count(v_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE videos SET clone_count = clone_count + 1 WHERE id = v_id;
$$;

GRANT EXECUTE ON FUNCTION increment_clone_count(uuid) TO anon, authenticated;
