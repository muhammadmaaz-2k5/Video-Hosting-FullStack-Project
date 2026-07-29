import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Upload,
  FolderPlus,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Folder as FolderIcon,
  Pencil,
  Copy as CopyIcon,
  ExternalLink,
  Video as VideoIcon,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { formatBytes, formatNumber, timeAgo } from '@/lib/format';
import type { Video, Image, Folder, Privacy } from '@/lib/types';

type Filter = 'all' | 'videos' | 'images' | 'folders';

interface Row {
  id: string;
  kind: 'video' | 'image' | 'folder';
  name: string;
  size: number;
  created: string;
  views: number;
  privacy: Privacy;
  status: Video['status'];
  raw: Video | Image | Folder;
}

export function Library() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [v, im, f] = await Promise.all([
      supabase.from('videos').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('images').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('folders').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (im.error) console.warn('Images query error:', im.error.message);

    const all: Row[] = [
      ...((f.data as Folder[]) ?? []).map((d) => ({
        id: d.id, kind: 'folder' as const, name: d.name, size: 0, created: d.created_at,
        views: 0, privacy: d.privacy, status: 'ready' as const, raw: d,
      })),
      ...((v.data as Video[]) ?? []).map((d) => ({
        id: d.id, kind: 'video' as const, name: d.title, size: d.size_bytes, created: d.created_at,
        views: d.view_count, privacy: d.privacy, status: d.status, raw: d,
      })),
      ...((im.data as Image[]) ?? []).map((d) => ({
        id: d.id, kind: 'image' as const, name: d.title, size: d.size_bytes, created: d.created_at,
        views: 0, privacy: d.privacy, status: d.status, raw: d,
      })),
    ];

    all.sort((a, b) => {
      if (a.kind === 'folder' && b.kind !== 'folder') return -1;
      if (a.kind !== 'folder' && b.kind === 'folder') return 1;
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });

    setRows(all);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let r = rows;
    if (filter !== 'all') {
      const map = { videos: 'video', images: 'image', folders: 'folder' } as const;
      r = r.filter((x) => x.kind === map[filter]);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q));
    }
    return r;
  }, [rows, filter, query]);

  const selectedRows = filtered.filter((r) => selected.has(r.id));

  const bulkDelete = async () => {
    if (selectedRows.length === 0) return;
    const vids = selectedRows.filter((r) => r.kind === 'video').map((r) => r.id);
    const imgs = selectedRows.filter((r) => r.kind === 'image').map((r) => r.id);
    const flds = selectedRows.filter((r) => r.kind === 'folder').map((r) => r.id);
    if (vids.length) await supabase.from('videos').delete().in('id', vids);
    if (imgs.length) await supabase.from('images').delete().in('id', imgs);
    if (flds.length) await supabase.from('folders').delete().in('id', flds);
    setSelected(new Set());
    success(`Deleted ${selectedRows.length} item${selectedRows.length > 1 ? 's' : ''}`);
    load();
  };

  const bulkPrivacy = async (privacy: Privacy) => {
    const vids = selectedRows.filter((r) => r.kind === 'video').map((r) => r.id);
    const imgs = selectedRows.filter((r) => r.kind === 'image').map((r) => r.id);
    const flds = selectedRows.filter((r) => r.kind === 'folder').map((r) => r.id);
    if (vids.length) await supabase.from('videos').update({ privacy }).in('id', vids);
    if (imgs.length) await supabase.from('images').update({ privacy }).in('id', imgs);
    if (flds.length) await supabase.from('folders').update({ privacy }).in('id', flds);
    setSelected(new Set());
    success(`Made ${selectedRows.length} item${selectedRows.length > 1 ? 's' : ''} ${privacy}`);
    load();
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;
    const { error: e } = await supabase.from('folders').insert({ name: newFolderName.trim(), owner_id: user.id });
    if (e) { error('Could not create folder'); return; }
    setNewFolderName('');
    setShowNewFolder(false);
    success('Folder created');
    load();
  };

  const rename = async (row: Row) => {
    if (!renameValue.trim()) return;
    const table = row.kind === 'video' ? 'videos' : row.kind === 'image' ? 'images' : 'folders';
    await supabase.from(table).update(row.kind === 'folder' ? { name: renameValue } : { title: renameValue }).eq('id', row.id);
    setRenameId(null);
    success('Renamed');
    load();
  };

  const togglePrivacy = async (row: Row) => {
    const next = row.privacy === 'public' ? 'private' : 'public';
    const table = row.kind === 'video' ? 'videos' : row.kind === 'image' ? 'images' : 'folders';
    await supabase.from(table).update({ privacy: next }).eq('id', row.id);
    success(`${row.name} is now ${next}`);
    load();
  };

  const deleteOne = async (row: Row) => {
    const table = row.kind === 'video' ? 'videos' : row.kind === 'image' ? 'images' : 'folders';
    await supabase.from(table).delete().eq('id', row.id);
    success('Deleted');
    load();
  };

  const copyLink = (row: Row) => {
    if (row.kind === 'folder') {
      navigator.clipboard.writeText(`${window.location.origin}/f/${row.id}`);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/e/${row.id}`);
    }
    success('Link copied');
  };

  const columns: Column<Row>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      sortValue: (r) => r.name.toLowerCase(),
      render: (r) => {
        const Icon = r.kind === 'video' ? Film : r.kind === 'image' ? ImageIcon : FolderIcon;
        if (renameId === r.id) {
          return (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => rename(r)}
              onKeyDown={(e) => e.key === 'Enter' && rename(r)}
              className="input py-1 text-sm max-w-xs"
            />
          );
        }
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon className={`w-4 h-4 shrink-0 ${r.kind === 'folder' ? 'text-accent' : 'text-text-muted'}`} />
            <span className="truncate font-medium">{r.name}</span>
          </div>
        );
      },
    },
    {
      key: 'size',
      label: 'Size',
      sortable: true,
      sortValue: (r) => r.size,
      render: (r) => <span className="text-text-muted">{r.kind === 'folder' ? '—' : formatBytes(r.size)}</span>,
    },
    {
      key: 'created',
      label: 'Created',
      sortable: true,
      sortValue: (r) => r.created,
      render: (r) => <span className="text-text-muted">{timeAgo(r.created)}</span>,
    },
    {
      key: 'views',
      label: 'Views',
      sortable: true,
      sortValue: (r) => r.views,
      render: (r) => <span className="text-text-muted">{r.kind === 'video' ? formatNumber(r.views) : '—'}</span>,
    },
    {
      key: 'privacy',
      label: 'Public',
      render: (r) => (
        r.kind === 'folder' ? (
          <PrivacyToggle value={r.privacy} size="sm" onChange={() => togglePrivacy(r)} />
        ) : (
          <span className={`inline-flex items-center gap-1 text-xs ${r.privacy === 'public' ? 'text-success' : 'text-text-muted'}`}>
            {r.privacy === 'public' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {r.privacy === 'public' ? 'Yes' : 'No'}
          </span>
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (r.kind === 'folder' ? <span className="text-text-dim text-xs">—</span> : <StatusBadge status={r.status} />),
    },
  ];

  const rowMenu = (row: Row) => (
    <>
      <button
        onClick={() => { setRenameId(row.id); setRenameValue(row.name); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-hover text-left"
      >
        <Pencil className="w-3.5 h-3.5" /> Rename
      </button>
      <button
        onClick={() => togglePrivacy(row)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-hover text-left"
      >
        {row.privacy === 'public' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        Make {row.privacy === 'public' ? 'private' : 'public'}
      </button>
      <button
        onClick={() => copyLink(row)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-hover text-left"
      >
        <CopyIcon className="w-3.5 h-3.5" /> Copy link
      </button>
      {row.kind !== 'folder' && (
        <Link
          to={`/e/${row.id}`}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-surface-hover text-left"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open
        </Link>
      )}
      <button
        onClick={() => deleteOne(row)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 text-left"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </>
  );

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-surface animate-pulse rounded" />
          <div className="card h-96 animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Library</h1>
          <p className="text-sm text-text-muted mt-0.5">{rows.length} items total</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library…"
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'videos', 'images', 'folders'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn px-3 py-2 text-sm capitalize transition-colors ${
                filter === f ? 'bg-accent text-black font-semibold' : 'bg-surface-hover text-text-muted hover:text-text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Link to="/upload" className="btn-primary text-sm"><Upload className="w-4 h-4" /> Upload</Link>
        <button onClick={() => setShowNewFolder((v) => !v)} className="btn-secondary text-sm">
          <FolderPlus className="w-4 h-4" /> Add Folder
        </button>
        <button onClick={load} className="btn-ghost text-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
        {selected.size > 0 && (
          <>
            <span className="text-xs text-text-muted ml-2">{selected.size} selected</span>
            <button onClick={() => bulkPrivacy('public')} className="btn-ghost text-sm text-success">
              <Eye className="w-4 h-4" /> Public
            </button>
            <button onClick={() => bulkPrivacy('private')} className="btn-ghost text-sm">
              <EyeOff className="w-4 h-4" /> Private
            </button>
            <button onClick={bulkDelete} className="btn-danger text-sm">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </>
        )}
      </div>

      {showNewFolder && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-2 mb-4"
        >
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="input flex-1"
            onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            autoFocus
          />
          <button onClick={createFolder} className="btn-primary">Create</button>
          <button onClick={() => setShowNewFolder(false)} className="btn-secondary">Cancel</button>
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<VideoIcon className="w-8 h-8" />}
          title={query ? 'No results' : 'Your library is empty'}
          subtitle={query ? 'Try a different search term' : 'Upload your first video to get started.'}
          action={
            !query && (
              <Link to="/upload" className="btn-primary">
                <Upload className="w-4 h-4" /> Upload your first video
              </Link>
            )
          }
        />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.id}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          rowMenu={rowMenu}
          onRowClick={(r) => {
            if (r.kind === 'folder') navigate(`/folder/${r.id}`);
            else navigate(`/e/${r.id}`);
          }}
          emptyState={<EmptyState icon={<VideoIcon className="w-8 h-8" />} title="No items" />}
        />
      )}
    </Layout>
  );
}
