import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Image as ImageIcon, FolderPlus, Check, Link as LinkIcon } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { UploadDropzone } from '@/components/UploadDropzone';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { StatusStateVisual } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase, publicStorageUrl } from '@/lib/supabase';
import { posterFor } from '@/lib/format';
import { cldPoster, cldThumb } from '@/lib/cloudinary';
import type { AssetStatus, Privacy, Folder } from '@/lib/types';

type Kind = 'video' | 'image';

/** Upload a file to Supabase Storage via XHR so we get real byte-level progress. */
async function uploadWithProgress(
  path: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ publicUrl: string | null; error: string | null }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  // Use the authenticated user's JWT when available
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? supabaseAnonKey;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${path}`;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        // Reserve the last 5 % for the DB write step
        const pct = Math.round((e.loaded / e.total) * 95);
        onProgress(pct);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${path}`;
        resolve({ publicUrl, error: null });
      } else {
        let msg = `Upload failed (HTTP ${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.message) msg = body.message;
        } catch {
          // ignore parse errors
        }
        resolve({ publicUrl: null, error: msg });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({ publicUrl: null, error: 'Network error — please check your connection.' });
    });

    xhr.addEventListener('abort', () => {
      resolve({ publicUrl: null, error: 'Upload cancelled.' });
    });

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    // x-upsert: false prevents accidental overwrites
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.send(file);
  });
}

export function Upload() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [kind, setKind] = useState<Kind>('video');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [privacy, setPrivacy] = useState<Privacy>('private');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [status, setStatus] = useState<AssetStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [resultId, setResultId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const loadFolders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('owner_id', user.id)
      .order('name');
    if (data) setFolders(data as Folder[]);
  };

  useEffect(() => {
    loadFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onFile = (f: File) => {
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ''));
    setStatus(null);
    setResultId(null);
    if (kind === 'image') {
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle('');
    setStatus(null);
    setResultId(null);
    setPreview(null);
    setProgress(0);
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;
    const { data, error: e } = await supabase
      .from('folders')
      .insert({ name: newFolderName.trim(), owner_id: user.id })
      .select()
      .single();
    if (e) {
      error('Could not create folder');
      return;
    }
    setFolders((prev) => [...prev, data as Folder]);
    setFolderId((data as Folder).id);
    setNewFolderName('');
    setShowNewFolder(false);
    success('Folder created');
  };

  const upload = async () => {
    if (!file || !user) return;

    setStatus('uploading');
    setProgress(0);

    const ext = file.name.split('.').pop() || (kind === 'video' ? 'mp4' : 'jpg');
    const path = `${user.id}/${kind}s/${crypto.randomUUID()}.${ext}`;

    // ── Phase 1: real XHR upload with byte-level progress ───────────────────
    const { publicUrl, error: upErr } = await uploadWithProgress(
      path,
      file,
      setProgress,
    );

    if (upErr || !publicUrl) {
      setStatus('failed');
      error(upErr ?? 'Upload failed');
      return;
    }

    const url = publicStorageUrl(publicUrl);

    // ── Phase 2: insert DB record ────────────────────────────────────────────
    setStatus('processing');

    const insertData = {
      owner_id: user.id,
      folder_id: folderId || null,
      title: title || file.name,
      storage_path: url,
      size_bytes: file.size,
      content_type: file.type,
      privacy,
      status: 'ready',
      ...(kind === 'video'
        ? { poster_url: cldPoster(posterFor(Math.floor(Math.random() * 8))) }
        : { thumbnail_url: cldThumb(url) }),
    };

    const table = kind === 'video' ? 'videos' : 'images';
    const { data: row, error: dbErr } = await supabase
      .from(table)
      .insert(insertData as any)
      .select()
      .single();

    if (dbErr) {
      setStatus('failed');
      error('Could not save record — please try again.');
      return;
    }

    // ── Phase 3: log activity ────────────────────────────────────────────────
    await supabase.from('activity').insert({
      user_id: user.id,
      type: 'upload',
      message: `Uploaded ${kind} "${title || file.name}"`,
    });

    setResultId(row.id);
    setStatus('ready');
    success(`${kind === 'video' ? 'Video' : 'Image'} ready to stream!`);
  };

  const link = resultId ? `${window.location.origin}/e/${resultId}` : null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Upload</h1>
        <p className="text-sm text-text-muted mb-6">Upload a video or image to your library.</p>

        <div className="flex gap-2 mb-6">
          {(['video', 'image'] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                clearFile();
              }}
              className={`btn px-4 py-2 text-sm capitalize transition-colors ${
                kind === k
                  ? 'bg-accent text-black font-semibold'
                  : 'bg-surface-hover text-text-muted hover:text-text-primary'
              }`}
            >
              {k === 'video' ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              {k}
            </button>
          ))}
        </div>

        <div className="card p-6">
          <AnimatePresence mode="wait">
            {/* ── Success state ─────────────────────────────────────────────── */}
            {status === 'ready' && resultId ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-8"
              >
                <StatusStateVisual status="ready" />
                <p className="text-sm text-text-primary mt-4 mb-4">Your {kind} is ready!</p>
                <div className="flex items-center gap-2 w-full max-w-md">
                  <div className="flex-1 input flex items-center gap-2 text-sm text-text-muted">
                    <LinkIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{link}</span>
                  </div>
                  <CopyLinkButton url={link!} label="Copy" />
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={clearFile} className="btn-secondary text-sm">
                    Upload another
                  </button>
                  <a href={link!} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                    Open
                  </a>
                </div>
              </motion.div>
            ) : status && status !== 'queued' ? (
              /* ── Uploading / processing / failed state ────────────────────── */
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-10 gap-4"
              >
                <StatusStateVisual status={status} progress={progress} />

                {/* Real progress bar */}
                {(status === 'uploading' || status === 'processing') && (
                  <div className="w-full max-w-sm">
                    <div className="flex justify-between text-xs text-text-muted mb-1.5">
                      <span>
                        {status === 'uploading' ? 'Uploading…' : 'Saving to library…'}
                      </span>
                      <span className="tabular-nums font-medium text-accent">{progress}%</span>
                    </div>
                    <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-accent rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'easeOut', duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-sm text-text-muted">
                  {status === 'uploading' && `Transferring ${progress}%…`}
                  {status === 'processing' && 'Saving your file…'}
                  {status === 'failed' && 'Upload failed. Please try again.'}
                </p>
              </motion.div>
            ) : (
              /* ── Form / dropzone state ────────────────────────────────────── */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <UploadDropzone
                  kind={kind}
                  onFile={onFile}
                  selectedFile={file}
                  onClear={clearFile}
                  accept={kind === 'video' ? 'video/*' : 'image/*'}
                >
                  {preview && kind === 'image' && (
                    <div className="mt-3 card overflow-hidden">
                      <img src={preview} alt="preview" className="w-full max-h-48 object-contain bg-base" />
                    </div>
                  )}
                </UploadDropzone>

                {file && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-5 space-y-4"
                  >
                    <div>
                      <label className="label">Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input"
                        placeholder="Untitled"
                      />
                    </div>

                    <div>
                      <label className="label">Folder</label>
                      <div className="flex gap-2">
                        <select
                          value={folderId}
                          onChange={(e) => setFolderId(e.target.value)}
                          className="input flex-1"
                        >
                          <option value="">/ (Root)</option>
                          {folders.map((f) => (
                            <option key={f.id} value={f.id}>
                              /{f.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowNewFolder((v) => !v)}
                          className="btn-secondary px-3"
                          title="New folder"
                        >
                          <FolderPlus className="w-4 h-4" />
                        </button>
                      </div>
                      {showNewFolder && (
                        <div className="flex gap-2 mt-2">
                          <input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="New folder name"
                            className="input flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                          />
                          <button onClick={createFolder} className="btn-primary px-3">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="label mb-0">Privacy</label>
                      <PrivacyToggle value={privacy} onChange={setPrivacy} />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button onClick={upload} className="btn-primary">
                        <>Upload {kind}</>
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
