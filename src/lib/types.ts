export type AssetStatus = 'queued' | 'uploading' | 'processing' | 'ready' | 'failed';
export type Privacy = 'public' | 'private';
export type AssetKind = 'video' | 'image' | 'folder';
export type CloneJobStatus = 'pending' | 'fetching' | 'processing' | 'done' | 'failed';
export type ActivityType =
  | 'upload'
  | 'clone'
  | 'folder_shared'
  | 'privacy_changed'
  | 'rename'
  | 'delete'
  | 'folder_created';

export interface Video {
  id: string;
  owner_id: string;
  folder_id: string | null;
  title: string;
  storage_path: string | null;
  size_bytes: number;
  content_type: string;
  poster_url: string | null;
  status: AssetStatus;
  privacy: Privacy;
  view_count: number;
  clone_count: number;
  cloned_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  owner_id: string;
  folder_id: string | null;
  title: string;
  storage_path: string | null;
  size_bytes: number;
  content_type: string;
  thumbnail_url: string | null;
  status: AssetStatus;
  privacy: Privacy;
  cloned_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  owner_id: string;
  name: string;
  privacy: Privacy;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CloneJob {
  id: string;
  user_id: string;
  source_type: 'video' | 'image' | 'folder' | 'url';
  source_ref: string;
  target_folder_id: string | null;
  status: CloneJobStatus;
  progress: number;
  result_video_id: string | null;
  result_image_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViewEvent {
  id: string;
  video_id: string;
  session_id: string;
  joined_at: string;
  left_at: string | null;
}

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  message: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export type AssetRow = Video | Image | Folder;

export interface LibraryItem {
  kind: AssetKind;
  data: Video | Image | Folder;
}
