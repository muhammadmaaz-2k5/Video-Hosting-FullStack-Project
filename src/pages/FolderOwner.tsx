import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Folder as FolderIcon, ArrowLeft, Pencil, Check, X } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { EmptyState } from '@/components/EmptyState';
import { VideoCard, ImageCard } from '@/components/AssetCard';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import type { Folder, Video, Image, Privacy } from '@/lib/types';

export function FolderOwner() {
  const { folderId } = useParams();
  const { success } = useToast();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    const [f, v, im] = await Promise.all([
      supabase.from('folders').select('*').eq('id', folderId).maybeSingle(),
      supabase.from('videos').select('*').eq('folder_id', folderId),
      supabase.from('images').select('*').eq('folder_id', folderId),
    ]);
    setFolder(f.data as Folder | null);
    setVideos((v.data as Video[]) ?? []);
    setImages((im.data as Image[]) ?? []);
    setLoading(false);
  }, [folderId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveName = async () => {
    if (!folder || !name.trim()) return;
    await supabase.from('folders').update({ name: name.trim() }).eq('id', folder.id);
    setFolder({ ...folder, name: name.trim() });
    setEditing(false);
    success('Folder renamed');
  };

  const togglePrivacy = async (privacy: Privacy) => {
    if (!folder) return;
    await supabase.from('folders').update({ privacy }).eq('id', folder.id);
    setFolder({ ...folder, privacy });
    success(`Folder is now ${privacy}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="card h-96 animate-pulse" />
      </Layout>
    );
  }

  if (!folder) {
    return (
      <Layout>
        <EmptyState icon={<FolderIcon className="w-8 h-8" />} title="Folder not found" />
      </Layout>
    );
  }

  const shareUrl = `${window.location.origin}/f/${folder.id}`;

  return (
    <Layout>
      <Link to="/library" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to library
      </Link>

      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
              <FolderIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input py-1 text-lg font-bold"
                    autoFocus
                  />
                  <button onClick={saveName} className="btn-primary p-2"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(false)} className="btn-secondary p-2"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  {folder.name}
                  <button onClick={() => { setEditing(true); setName(folder.name); }} className="text-text-muted hover:text-accent">
                    <Pencil className="w-4 h-4" />
                  </button>
                </h1>
              )}
              <p className="text-sm text-text-muted mt-0.5">
                {videos.length} videos · {images.length} images
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PrivacyToggle value={folder.privacy} onChange={togglePrivacy} />
            <CopyLinkButton url={shareUrl} />
          </div>
        </div>
      </div>

      {videos.length === 0 && images.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="w-8 h-8" />}
          title="This folder is empty"
          subtitle="Move videos or images here from your library."
          action={<Link to="/upload" className="btn-primary">Upload</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
          {images.map((im, i) => <ImageCard key={im.id} image={im} index={i} />)}
        </div>
      )}
    </Layout>
  );
}
