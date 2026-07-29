/*
# Fix broken Pexels poster URLs

Two Pexels photo IDs were removed/renumbered and now return 404:
- 3129957 (Tokyo Street Food Tour poster) -> 1640777
- 364026 (Mountain Timelapse poster) -> 691668

This migration updates existing rows in the videos table.
*/

UPDATE videos
SET poster_url = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop'
WHERE poster_url LIKE '%pexels-photo-3129957%';

UPDATE videos
SET poster_url = 'https://images.pexels.com/photos/691668/pexels-photo-691668.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop'
WHERE poster_url LIKE '%pexels-photo-364026%';
