import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download as DownloadIcon, Lock, FileVideo, HardDrive, FileCode } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { StatusStateVisual } from '@/components/StatusBadge';
import { cldPoster } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { formatBytes } from '@/lib/format';
import type { Video } from '@/lib/types';

export function Download() {
  const { videoId } = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    (async () => {
      const { data } = await supabase.from('videos').select('*').eq('id', videoId).maybeSingle();
      if (!data) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const v = data as Video;
      if (v.privacy === 'private') {
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
        />
      </div>
    );
  }

  if (!video) return null;

  if (video.status !== 'ready') {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center p-8">
        <StatusStateVisual status={video.status} />
        <p className="text-sm text-text-muted mt-4">Video is still processing</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-black" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-bold text-text-primary">VaultStream</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">{video.title}</h1>
        <p className="text-sm text-text-muted mb-6">Download this video</p>

        {video.poster_url && (
          <img
            src={cldPoster(video.poster_url)}
            alt={video.title}
            className="w-full aspect-video object-cover rounded-xl mb-6"
          />
        )}

        <div className="card p-5 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <FileVideo className="w-5 h-5 text-accent" />
              <span className="text-xs text-text-muted">Format</span>
              <span className="text-sm font-medium text-text-primary">MP4</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <HardDrive className="w-5 h-5 text-info" />
              <span className="text-xs text-text-muted">Size</span>
              <span className="text-sm font-medium text-text-primary">{formatBytes(video.size_bytes)}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <FileCode className="w-5 h-5 text-success" />
              <span className="text-xs text-text-muted">Codec</span>
              <span className="text-sm font-medium text-text-primary">H.264</span>
            </div>
          </div>
        </div>

        <a href={video.storage_path || '#'} download className="btn-primary w-full py-3 text-base">
          <DownloadIcon className="w-5 h-5" /> Download video
        </a>
      </main>
    </div>
  );
}
