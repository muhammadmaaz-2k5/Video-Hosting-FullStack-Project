import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, Lock, Download as DownloadIcon } from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { EmptyState } from '@/components/EmptyState';
import { StatusStateVisual } from '@/components/StatusBadge';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { supabase } from '@/lib/supabase';
import { formatNumber } from '@/lib/format';
import { cldPoster } from '@/lib/cloudinary';
import type { Video } from '@/lib/types';

export function Embed() {
  const { videoId } = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    (async () => {
      // try owner view first (auth), then public
      const { data } = await supabase.from('videos').select('*').eq('id', videoId).maybeSingle();
      if (!data) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const v = data as Video;
      if (v.privacy === 'private') {
        // check if current user is owner
        const { data: u } = await supabase.auth.getUser();
        if (!u.user || u.user.id !== v.owner_id) {
          setDenied(true);
          setLoading(false);
          return;
        }
      }
      setVideo(v);
      setLoading(false);
    })();
  }, [videoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <EmptyState
          icon={<Lock className="w-8 h-8" />}
          title="This video is private or unavailable"
          subtitle="If you have the correct link, make sure you're signed in as the owner."
        />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {video.status !== 'ready' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <StatusStateVisual status={video.status} />
          <p className="text-sm text-text-muted mt-4">Video is still processing</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4">
          <VideoPlayer videoId={video.id} videoSrc={video.storage_path} poster={video.poster_url ? cldPoster(video.poster_url) : undefined} title={video.title} />
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-text-primary">{video.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {formatNumber(video.view_count)} views
                </span>
                <span className={`inline-flex items-center gap-1 ${video.privacy === 'public' ? 'text-success' : 'text-text-muted'}`}>
                  {video.privacy === 'public' ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {video.privacy}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/d/${video.id}`} className="btn-secondary text-sm">
                <DownloadIcon className="w-4 h-4" /> Download
              </Link>
              <CopyLinkButton url={`${window.location.origin}/e/${video.id}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
