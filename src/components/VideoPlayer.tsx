import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uuid, SAMPLE_VIDEO_SRC } from '@/lib/format';

interface Props {
  videoId: string;
  poster?: string | null;
  title: string;
}

/**
 * Native <video> player that emits presence (view:join) on mount
 * and view:leave on unmount, so the dashboard's live viewer count works.
 */
export function VideoPlayer({ videoId, poster, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionIdRef = useRef<string>(uuid());
  const channelIdRef = useRef<string>('');

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const channelName = `video:${videoId}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: sessionId } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ joined_at: Date.now() });
      }
    });

    channelIdRef.current = channelName;

    // log a view event row for lifetime totals
    supabase.from('view_events').insert({
      video_id: videoId,
      session_id: sessionId,
    }).then(({ error }) => {
      if (!error) {
        supabase.rpc('increment_video_view_count', { v_id: videoId }).then(() => {});
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      supabase
        .from('view_events')
        .update({ left_at: new Date().toISOString() })
        .eq('video_id', videoId)
        .eq('session_id', sessionId)
        .is('left_at', 'null')
        .then(() => {});
    };
  }, [videoId]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        src={SAMPLE_VIDEO_SRC}
        poster={poster ?? undefined}
        controls
        playsInline
        className="w-full h-full"
        title={title}
      />
    </div>
  );
}
