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
import type { Video, Image } from '@/lib/types';

export function Embed() {
  const { videoId } = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [image, setImage] = useState<Image | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    (async () => {
      // try videos table first
      const { data: vData } = await supabase.from('videos').select('*').eq('id', videoId).maybeSingle();
      if (vData) {
        const v = vData as Video;
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
        return;
      }

      // try images table
      const { data: iData } = await supabase.from('images').select('*').eq('id', videoId).maybeSingle();
      if (iData) {
        const img = iData as Image;
        if (img.privacy === 'private') {
          const { data: u } = await supabase.auth.getUser();
          if (!u.user || u.user.id !== img.owner_id) {
            setDenied(true);
            setLoading(false);
            return;
          }
        }
        setImage(img);
        setLoading(false);
        return;
      }

      setDenied(true);
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

  if (!video && !image) return null;

  // ── Image view ─────────────────────────────────────────────────────────────
  if (image) {
    const imgUrl = image.storage_path || '';
    return (
      <div className="min-h-screen bg-base flex flex-col">
        {image.status !== 'ready' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <StatusStateVisual status={image.status} />
            <p className="text-sm text-text-muted mt-4">Image is still processing</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4">
            <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <img src={imgUrl} alt={image.title} className="max-w-full max-h-[80vh] object-contain" />
            </div>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-text-primary">{image.title}</h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                  <span className={`inline-flex items-center gap-1 ${image.privacy === 'public' ? 'text-success' : 'text-text-muted'}`}>
                    {image.privacy === 'public' ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {image.privacy}
                  </span>
                </div>
              </div>
              <CopyLinkButton url={`${window.location.origin}/e/${image.id}`} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Video view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base flex flex-col">
      {video!.status !== 'ready' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <StatusStateVisual status={video!.status} />
          <p className="text-sm text-text-muted mt-4">Video is still processing</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4">
          <VideoPlayer videoId={video!.id} videoSrc={video!.storage_path} poster={video!.poster_url ? cldPoster(video!.poster_url) : undefined} />
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-text-primary">{video!.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {formatNumber(video!.view_count)} views
                </span>
                <span className={`inline-flex items-center gap-1 ${video!.privacy === 'public' ? 'text-success' : 'text-text-muted'}`}>
                  {video!.privacy === 'public' ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {video!.privacy}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/d/${video!.id}`} className="btn-secondary text-sm">
                <DownloadIcon className="w-4 h-4" /> Download
              </Link>
              <CopyLinkButton url={`${window.location.origin}/e/${video!.id}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
