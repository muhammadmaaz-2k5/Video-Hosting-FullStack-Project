import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Video, CloneJob, Activity } from '@/lib/types';


interface SubscribeOptions {
  onVideoChange?: (video: Video) => void;
  onImageChange?: () => void;
  onCloneJobChange?: (job: CloneJob) => void;
  onActivity?: (activity: Activity) => void;
}

/**
 * Subscribes to Supabase Realtime channels for the tables the UI cares about.
 * Returns an unsubscribe function.
 */
export function useRealtime(opts: SubscribeOptions) {
  useEffect(() => {
    let cleaned = false;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (opts.onVideoChange) {
      const ch = supabase
        .channel('videos-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'videos' },
          (payload) => opts.onVideoChange?.(payload.new as Video),
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && !cleaned) {
            console.warn('[Realtime] videos-changes subscription error');
          }
        });
      channels.push(ch);
    }

    if (opts.onImageChange) {
      const ch = supabase
        .channel('images-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'images' },
          () => opts.onImageChange?.(),
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && !cleaned) {
            console.warn('[Realtime] images-changes subscription error');
          }
        });
      channels.push(ch);
    }

    if (opts.onCloneJobChange) {
      const ch = supabase
        .channel('clone-jobs-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clone_jobs' },
          (payload) => opts.onCloneJobChange?.(payload.new as CloneJob),
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && !cleaned) {
            console.warn('[Realtime] clone-jobs-changes subscription error');
          }
        });
      channels.push(ch);
    }

    if (opts.onActivity) {
      const ch = supabase
        .channel('activity-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activity' },
          (payload) => opts.onActivity?.(payload.new as Activity),
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && !cleaned) {
            console.warn('[Realtime] activity-changes subscription error');
          }
        });
      channels.push(ch);
    }

    return () => {
      cleaned = true;
      channels.forEach((c) => supabase.removeChannel(c));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Live viewer count via Realtime Presence.
 * Each embed page joins a presence channel `video:<id>`. The dashboard
 * counts presence entries to compute live viewers per video.
 */
export function joinVideoPresence(videoId: string, sessionId: string) {
  const channel = supabase.channel(`video:${videoId}`, {
    config: { presence: { key: sessionId } },
  });
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ joined_at: Date.now() });
    }
  });
  return channel;
}

export async function getPresenceCount(videoId: string): Promise<number> {
  const state = await supabase.channel(`video:${videoId}`).presenceState();
  return Object.keys(state).length;
}
