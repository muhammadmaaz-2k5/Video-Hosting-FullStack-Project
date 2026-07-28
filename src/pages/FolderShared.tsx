import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Folder as FolderIcon, Copy, Lock } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { VideoCard, ImageCard } from '@/components/AssetCard';
import { useAuth } from '@/context/AuthContext';
import { useCloneTray } from '@/context/CloneTrayContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { posterFor, uuid } from '@/lib/format';
import { cldPoster } from '@/lib/cloudinary';
import type { Folder, Video, Image } from '@/lib/types';

export function FolderShared() {
  const { folderId } = useParams();
  const { session } = useAuth();
  const { start, update } = useCloneTray();
  const { success } = useToast();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folderId) return;
    (async () => {
      setLoading(true);
      const { data: f } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('privacy', 'public')
        .maybeSingle();
      if (!f) {
        setLoading(false);
        return;
      }
      setFolder(f as Folder);
      const [v, im] = await Promise.all([
        supabase.from('videos').select('*').eq('folder_id', folderId).eq('privacy', 'public'),
        supabase.from('images').select('*').eq('folder_id', folderId).eq('privacy', 'public'),
      ]);
      setVideos((v.data as Video[]) ?? []);
      setImages((im.data as Image[]) ?? []);
      setLoading(false);
    })();
  }, [folderId]);

  const cloneOne = async (video: Video) => {
    if (!session) {
      navigate('/login', { state: { from: `/f/${folderId}` } });
      return;
    }
    const item = {
      id: uuid(),
      label: video.title,
      status: 'pending' as const,
      progress: 0,
      kind: 'video' as const,
    };
    start([item]);

    update(item.id, { status: 'fetching', progress: 15 });
    await new Promise((r) => setTimeout(r, 700));
    update(item.id, { status: 'processing', progress: 40 });

    const { data: row } = await supabase.from('videos').insert({
      title: video.title,
      storage_path: video.storage_path,
      size_bytes: video.size_bytes,
      content_type: video.content_type,
      poster_url: cldPoster(video.poster_url || posterFor(0)),
      status: 'processing',
      privacy: 'private',
      cloned_from: video.id,
    }).select().single();

    await new Promise((r) => setTimeout(r, 900));
    if (row) {
      await supabase.from('videos').update({ status: 'ready' }).eq('id', row.id);
    }
    update(item.id, { status: 'done', progress: 100 });
    success('Cloned to your library!');
  };

  const cloneAll = async () => {
    if (!session) {
      navigate('/login', { state: { from: `/f/${folderId}` } });
      return;
    }
    const all = [...videos, ...images];
    if (all.length === 0) return;
    const items = all.map((x) => ({
      id: uuid(),
      label: 'title' in x ? x.title : 'item',
      status: 'pending' as const,
      progress: 0,
      kind: ('content_type' in x && x.content_type?.startsWith('image') ? 'image' : 'video') as 'video' | 'image',
    }));
    start(items);
    success(`Cloning ${all.length} items…`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="card h-96 w-full max-w-4xl animate-pulse m-4" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <EmptyState
          icon={<Lock className="w-8 h-8" />}
          title="This folder is private"
          subtitle="You need the exact share link to view this folder."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-black" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-bold text-text-primary">VaultStream</span>
          </Link>
          {!session && (
            <Link to="/login" className="btn-primary text-sm">Sign in to clone</Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="card p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
              <FolderIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{folder.name}</h1>
              <p className="text-sm text-text-muted">{videos.length + images.length} items</p>
            </div>
          </div>
          <button onClick={cloneAll} className="btn-primary">
            <Copy className="w-4 h-4" /> Clone entire folder
          </button>
        </div>

        {videos.length === 0 && images.length === 0 ? (
          <EmptyState icon={<FolderIcon className="w-8 h-8" />} title="This folder is empty" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((v, i) => (
              <div key={v.id} className="relative group">
                <VideoCard video={v} index={i} showClone />
                {v.status === 'ready' && (
                  <button
                    onClick={() => cloneOne(v)}
                    className="absolute bottom-16 right-2 btn-primary text-xs py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-3 h-3" /> Clone
                  </button>
                )}
              </div>
            ))}
            {images.map((im, i) => (
              <ImageCard key={im.id} image={im} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
