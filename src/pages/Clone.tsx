import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Folder as FolderIcon, Link as LinkIcon, Check, X, Zap } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCloneTray, type CloneTrayItem } from '@/context/CloneTrayContext';
import { supabase } from '@/lib/supabase';
import { posterFor, uuid } from '@/lib/format';
import { cldPoster } from '@/lib/cloudinary';
import type { Folder } from '@/lib/types';

interface ParsedLink {
  raw: string;
  valid: boolean;
  kind: 'video' | 'image' | 'folder' | 'unknown';
  reason?: string;
  id?: string;
}

const SAMPLE_LINKS = `https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg
https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4`;

function parseLine(raw: string): ParsedLink {
  const line = raw.trim();
  if (!line) return { raw, valid: false, kind: 'unknown', reason: 'Empty' };

  const embedMatch = line.match(/\/e\/([a-f0-9-]+)/i);
  if (embedMatch) return { raw, valid: true, kind: 'video', id: embedMatch[1] };

  const folderMatch = line.match(/\/f\/([a-f0-9-]+)/i);
  if (folderMatch) return { raw, valid: true, kind: 'folder', id: folderMatch[1] };

  try {
    const u = new URL(line);
    const path = u.pathname.toLowerCase();
    if (/\.(mp4|webm|mov|m3u8)(\?|$)/.test(path)) return { raw, valid: true, kind: 'video' };
    if (/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/.test(path)) return { raw, valid: true, kind: 'image' };
    return { raw, valid: true, kind: 'video' };
  } catch {
    return { raw, valid: false, kind: 'unknown', reason: 'Not a valid URL' };
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function Clone() {
  const { user } = useAuth();
  const { success } = useToast();
  const { start, update } = useCloneTray();
  const [params] = useSearchParams();
  const [text, setText] = useState('');
  const [folderPath, setFolderPath] = useState('/');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('folders').select('*').eq('owner_id', user.id).order('name').then(({ data }) => {
      if (data) setFolders(data as Folder[]);
    });
  }, [user]);

  useEffect(() => {
    const src = params.get('src');
    if (src) {
      setText(`${window.location.origin}/e/${src.trim()}`);
    }
  }, [params]);

  const lines = useMemo(() => text.split('\n').filter((l) => l.trim()), [text]);
  const parsed = useMemo(() => lines.map(parseLine), [lines]);
  const validLinks = parsed.filter((p) => p.valid);
  const invalidLinks = parsed.filter((p) => !p.valid && p.reason !== 'Empty');

  const SLOT_TOTAL = 100;

  const runClone = useCallback(async () => {
    if (!user || validLinks.length === 0 || cloning) return;
    setCloning(true);

    let targetFolderId: string | null = null;
    if (folderPath.trim() !== '/' && folderPath.trim() !== '') {
      const name = folderPath.trim().replace(/^\//, '');
      const existing = folders.find((f) => f.name === name);
      if (existing) {
        targetFolderId = existing.id;
      } else {
        const { data } = await supabase
          .from('folders')
          .insert({ name, owner_id: user.id })
          .select()
          .single();
        if (data) {
          targetFolderId = (data as Folder).id;
          setFolders((prev) => [...prev, data as Folder]);
        }
      }
    }

    const items: CloneTrayItem[] = validLinks.map((p) => ({
      id: uuid(),
      label: p.raw.length > 40 ? p.raw.slice(0, 40) + '…' : p.raw,
      status: 'pending',
      progress: 0,
      kind: p.kind === 'image' ? 'image' : 'video',
    }));

    start(items);

    for (const [i, p] of validLinks.entries()) {
      const itemId = items[i].id;
      const isImage = p.kind === 'image';

      await sleep(400);
      update(itemId, { status: 'fetching', progress: 15 });

      // If cloning from an internal embed/folder link, fetch the source record
      let srcRecord: Record<string, unknown> | null = null;
      if (p.id) {
        const table = isImage ? 'images' : 'videos';
        const { data } = await supabase.from(table).select('*').eq('id', p.id).maybeSingle();
        srcRecord = data;
      }

      await sleep(700);
      update(itemId, { status: 'processing', progress: 40 });

      const rawName = p.raw.split('?')[0].split('/').pop()?.replace(/\.[^.]+$/, '')?.replace(/_/g, ' ') || '';
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const dbTitle = (srcRecord?.title as string) || '';
      const isUuidTitle = uuidRe.test(dbTitle) || uuidRe.test(rawName);
      const srcTitle = isUuidTitle ? (isImage ? 'Image' : 'Video') : (dbTitle || decodeURIComponent(rawName) || 'Untitled');
      const srcSize = (srcRecord?.size_bytes as number) ?? 0;
      const srcPath = (srcRecord?.storage_path as string) || p.raw;
      const srcContentType = (srcRecord?.content_type as string) || (isImage ? 'image/jpeg' : 'video/mp4');

      let row: { id: string } | null = null;
      let dbErr = null;

      if (isImage) {
        const res = await supabase.from('images').insert({
            owner_id: user.id,
            folder_id: targetFolderId,
            title: `Clone of ${srcTitle}`,
            storage_path: srcPath,
            size_bytes: srcSize,
            content_type: srcContentType,
            thumbnail_url: (srcRecord?.thumbnail_url as string) || srcPath,
            status: 'processing',
            privacy: 'private',
          }).select().single();
        row = res.data;
        dbErr = res.error;
      } else {
        const res = await supabase.from('videos').insert({
            owner_id: user.id,
            folder_id: targetFolderId,
            title: `Clone of ${srcTitle}`,
            storage_path: srcPath,
            size_bytes: srcSize,
            content_type: srcContentType,
            poster_url: (srcRecord?.poster_url as string) || cldPoster(posterFor(i)),
            status: 'processing',
            privacy: 'private',
            cloned_from: p.id ?? null,
          }).select().single();
        row = res.data;
        dbErr = res.error;
      }
      if (dbErr || !row) {
        update(itemId, { status: 'failed' });
        continue;
      }

      update(itemId, { status: 'processing', progress: 80 });
      await sleep(800);

      if (p.id && !isImage) {
        await supabase.rpc('increment_clone_count', { v_id: p.id }).then(() => {});
      }

      await supabase.from(isImage ? 'images' : 'videos').update({ status: 'ready' }).eq('id', row.id);
      update(itemId, { status: 'done', progress: 100 });

      await supabase.from('activity').insert({
        user_id: user.id,
        type: 'clone',
        message: `Cloned ${isImage ? 'image' : 'video'} "${srcTitle}"`,
      });
    }

    success('Clone queue submitted');
    setCloning(false);
    setText('');
  }, [user, validLinks, folderPath, folders, start, update, success, cloning]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Clone</h1>
        <p className="text-sm text-text-muted mb-6">
          Paste links to videos, images, or shared folders and clone them into your account.
        </p>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Zap className="w-4 h-4 text-accent" />
              <span>Auto-detects video, image, and folder links</span>
            </div>
            <span className="chip bg-surface-hover text-text-muted">
              Clone slots: {SLOT_TOTAL} out of {SLOT_TOTAL} available
            </span>
          </div>

          <div className="mb-4">
            <label className="label">Links</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ex: https://example.com/video.mp4"
              rows={7}
              className="input font-mono text-sm resize-y"
            />
            {text.trim() === '' && (
              <button
                onClick={() => setText(SAMPLE_LINKS)}
                className="text-xs text-accent hover:text-accent-hover mt-2"
              >
                Try sample links
              </button>
            )}
          </div>

          {parsed.length > 0 && (
            <div className="space-y-1.5 mb-4">
              <AnimatePresence>
                {parsed.map((p, i) => {
                  if (p.reason === 'Empty') return null;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                        p.valid ? 'bg-success/5 text-text-muted' : 'bg-danger/5 text-text-muted'
                      }`}
                    >
                      {p.valid ? (
                        <Check className="w-3.5 h-3.5 text-success shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-danger shrink-0" />
                      )}
                      <span className="truncate flex-1">{p.raw}</span>
                      <span className={`chip ${p.valid ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                        {p.kind !== 'unknown' && p.valid ? p.kind : p.reason}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          <div className="mb-6">
            <label className="label">Clone to Folder</label>
            <div className="flex items-center gap-2 input">
              <FolderIcon className="w-4 h-4 text-accent" />
              <input
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="/"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            {folders.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {folders.slice(0, 6).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFolderPath(`/${f.name}`)}
                    className="chip bg-surface-hover text-text-muted hover:text-text-primary"
                  >
                    /{f.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={runClone}
              disabled={validLinks.length === 0 || cloning}
              className="btn-primary"
            >
              <Copy className="w-4 h-4" />
              {validLinks.length > 1 ? `Clone ${validLinks.length} items` : 'Add to clone queue'}
            </button>
          </div>
        </div>

        {validLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 text-xs text-text-muted"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {validLinks.length} valid link{validLinks.length !== 1 ? 's' : ''} detected
            {invalidLinks.length > 0 && ` · ${invalidLinks.length} invalid`}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
