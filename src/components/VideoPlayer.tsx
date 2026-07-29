import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { supabase, publicStorageUrl } from '@/lib/supabase';
import { uuid } from '@/lib/format';



interface Props {
  videoId: string;
  videoSrc?: string | null;
  poster?: string | null;
  title: string;
}

/**
 * ArtPlayer-powered video player.
 *
 * Features:
 *  - HLS (.m3u8) via hls.js  |  MP4/WebM native
 *  - PiP, fullscreen, web-fullscreen
 *  - Playback rate, screenshot, hotkeys
 *  - Mini progress bar, settings panel
 *  - Supabase Realtime Presence tracking (live viewer count)
 *  - view_events INSERT + increment_video_view_count RPC
 */
export function VideoPlayer({ videoId, videoSrc, poster, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const sessionIdRef = useRef<string>(uuid());

  useEffect(() => {
    if (!containerRef.current) return;

    const sessionId = sessionIdRef.current;
    const channelName = `video:${videoId}`;

    // ── Supabase Realtime Presence ───────────────────────────────────────────
    const channel = supabase.channel(channelName, {
      config: { presence: { key: sessionId } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ joined_at: Date.now() });
      }
    });

    // ── Log view event + increment counter ───────────────────────────────────
    supabase
      .from('view_events')
      .insert({ video_id: videoId, session_id: sessionId })
      .then(({ error }) => {
        if (!error) {
          supabase.rpc('increment_video_view_count', { v_id: videoId }).then(() => {});
        }
      });

    // ── Resolve storage URL ──────────────────────────────────────────────────
    const src = videoSrc ? publicStorageUrl(videoSrc) : '';
    const isHls = src.toLowerCase().includes('.m3u8');

    // ── Mount ArtPlayer ──────────────────────────────────────────────────────
    artRef.current = new Artplayer({
      container: containerRef.current,
      url: src,
      poster: poster ?? undefined,
      volume: 0.8,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: false,
      screenshot: true,
      setting: true,
      hotkey: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: false,
      playsInline: true,
      autoPlayback: false,
      theme: '#f7941d',
      lang: 'en',
      // HLS support via hls.js for .m3u8 streams
      ...(isHls && {
        customType: {
          m3u8: (video: HTMLVideoElement, url: string) => {
            if (Hls.isSupported()) {
              const hls = new Hls({ startLevel: -1 });
              hls.loadSource(url);
              hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              // Safari native HLS
              video.src = url;
            }
          },
        },
      }),
    });

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      // Leave presence
      channel.untrack();
      supabase.removeChannel(channel);

      // Update view_events left_at
      supabase
        .from('view_events')
        .update({ left_at: new Date().toISOString() })
        .eq('video_id', videoId)
        .eq('session_id', sessionId)
        .is('left_at', 'null')
        .then(() => {});

      // Destroy player
      artRef.current?.destroy(false);
      artRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // If the src changes (e.g. same page navigation) update the player URL
  useEffect(() => {
    if (!artRef.current || !videoSrc) return;
    const resolved = publicStorageUrl(videoSrc);
    if (artRef.current.url !== resolved) {
      artRef.current.url = resolved;
    }
  }, [videoSrc]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
