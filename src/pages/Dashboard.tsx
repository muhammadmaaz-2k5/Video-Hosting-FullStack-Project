import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  Film,
  Image as ImageIcon,
  Folder as FolderIcon,
  HardDrive,
  Eye,
  TrendingUp,
  Activity as ActivityIcon,
  Upload,
  Copy,
  Share2,
  Pencil,
  Trash2,
  Globe,
  Radio,
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { LineChart } from '@/components/LineChart';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';
import { supabase } from '@/lib/supabase';
import { formatBytes, formatNumber, timeAgo, posterFor } from '@/lib/format';
import { cldPoster } from '@/lib/cloudinary';
import type { Video, Image as ImageAsset, Folder, Activity } from '@/lib/types';

const ACTIVITY_ICONS = {
  upload: { Icon: Upload, color: 'text-info', bg: 'bg-info/10' },
  clone: { Icon: Copy, color: 'text-accent', bg: 'bg-accent/10' },
  folder_shared: { Icon: Share2, color: 'text-success', bg: 'bg-success/10' },
  privacy_changed: { Icon: Globe, color: 'text-text-muted', bg: 'bg-surface-hover' },
  rename: { Icon: Pencil, color: 'text-text-muted', bg: 'bg-surface-hover' },
  delete: { Icon: Trash2, color: 'text-danger', bg: 'bg-danger/10' },
  folder_created: { Icon: FolderIcon, color: 'text-accent', bg: 'bg-accent/10' },
};

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ videos: 0, images: 0, folders: 0, storage: 0 });
  const [liveCount, setLiveCount] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [liveViewers, setLiveViewers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [v, im, f, act] = await Promise.all([
      supabase.from('videos').select('*').eq('owner_id', user.id),
      supabase.from('images').select('*').eq('owner_id', user.id),
      supabase.from('folders').select('*').eq('owner_id', user.id),
      supabase.from('activity').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12),
    ]);

    if (im.error) console.warn('Images query error:', im.error.message);

    const vids = (v.data as Video[]) ?? [];
    const imgs = (im.data as ImageAsset[]) ?? [];
    const flds = (f.data as Folder[]) ?? [];
    const acts = (act.data as Activity[]) ?? [];

    const storage = [...vids, ...imgs].reduce((s, x) => s + (x.size_bytes || 0), 0);

    setStats({
      videos: vids.length,
      images: imgs.length,
      folders: flds.length,
      storage,
    });
    setVideos(vids);
    setActivities(acts);

    // ── Real analytics: query view_events for last 7 days ─────────────────
    const today = new Date();
    // Start of 6 days ago (midnight)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const days: { label: string; value: number }[] = [];

    if (vids.length > 0) {
      const videoIds = vids.map((vid) => vid.id);

      const { data: viewRows } = await supabase
        .from('view_events')
        .select('joined_at')
        .in('video_id', videoIds)
        .gte('joined_at', sevenDaysAgo.toISOString());

      const rows = viewRows ?? [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const count = rows.filter((r) => r.joined_at.startsWith(dayStr)).length;
        days.push({ label, value: count });
      }
    } else {
      // No videos yet — show empty chart with day labels
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        days.push({ label, value: 0 });
      }
    }

    setChartData(days);
    setLoading(false);
  }, [user]);

  // poll presence counts for each video
  const presenceChannelsRef = useRef<Map<string, ReturnType<typeof supabase.channel>>>(new Map());

  const pollLive = useCallback(async () => {
    if (videos.length === 0) return;
    const counts: Record<string, number> = {};
    let total = 0;

    // Ensure we have subscribed presence channels for each video
    const currentIds = new Set(videos.map((v) => v.id));

    // Remove channels for videos no longer in the list
    for (const [id, ch] of presenceChannelsRef.current) {
      if (!currentIds.has(id)) {
        supabase.removeChannel(ch);
        presenceChannelsRef.current.delete(id);
      }
    }

    // Subscribe to presence channels for new videos
    for (const vid of videos) {
      if (!presenceChannelsRef.current.has(vid.id)) {
        const ch = supabase.channel(`video:${vid.id}`, {
          config: { presence: { key: `dashboard-${vid.id}` } },
        });
        ch.subscribe();
        presenceChannelsRef.current.set(vid.id, ch);
      }
    }

    // Poll presence state from subscribed channels
    for (const vid of videos) {
      const ch = presenceChannelsRef.current.get(vid.id);
      if (ch) {
        const state = ch.presenceState();
        const n = Object.keys(state).length;
        counts[vid.id] = n;
        total += n;
      } else {
        counts[vid.id] = 0;
      }
    }

    setLiveViewers(counts);
    setLiveCount(total);
  }, [videos]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (videos.length === 0) return;
    pollLive();
    const interval = setInterval(pollLive, 4000);
    return () => clearInterval(interval);
  }, [pollLive, videos.length]);

  // Cleanup presence channels on unmount
  useEffect(() => {
    const channels = presenceChannelsRef.current;
    return () => {
      for (const [, ch] of channels) {
        supabase.removeChannel(ch);
      }
      channels.clear();
    };
  }, []);

  // realtime: update videos + prepend new activity
  useRealtime({
    onVideoChange: (video) => {
      setVideos((prev) => {
        const idx = prev.findIndex((v) => v.id === video.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = video;
          return next;
        }
        return [video, ...prev];
      });
    },
    onActivity: (act) => {
      setActivities((prev) => [act, ...prev].slice(0, 12));
    },
  });

  const topVideos = [...videos].sort((a, b) => b.view_count - a.view_count).slice(0, 5);
  const watchingNow = videos.filter((v) => (liveViewers[v.id] ?? 0) > 0);
  const notWatching = videos.filter((v) => (liveViewers[v.id] ?? 0) === 0);

  if (loading) {
    return (
      <Layout>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card h-80 animate-pulse lg:col-span-2" />
          <div className="card h-80 animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Dashboard</h1>
      <p className="text-sm text-text-muted mb-6">Real-time overview of your content and audience.</p>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={Users} value={liveCount} label="Users watching" live liveDot={liveCount > 0} iconColor="text-success" iconBg="bg-success/15" />
        <StatCard icon={Film} value={stats.videos} label="Total videos" />
        <StatCard icon={ImageIcon} value={stats.images} label="Total images" />
        <StatCard icon={FolderIcon} value={stats.folders} label="Total folders" />
        <StatCard icon={HardDrive} value={formatBytes(stats.storage)} label="Storage used" iconColor="text-info" iconBg="bg-info/15" />
      </div>

      {/* chart + top files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Last 7 days stats
              </h2>
              <p className="text-xs text-text-muted mt-0.5">Daily views from your audience (last 7 days)</p>
            </div>
          </div>
          <LineChart data={chartData} />
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-accent" /> Top files
          </h2>
          {topVideos.length === 0 ? (
            <EmptyState title="No views" subtitle="Upload videos to start tracking views." className="py-8" />
          ) : (
            <div className="space-y-2">
              {topVideos.map((v, i) => (
                <Link
                  key={v.id}
                  to={`/e/${v.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                    {i + 1}
                  </div>
                  <img
                    src={cldPoster(v.poster_url || posterFor(i))}
                    alt=""
                    className="w-10 h-6 rounded object-cover shrink-0"
                  />
                  <span className="text-sm text-text-primary truncate flex-1">{v.title}</span>
                  <span className="text-xs text-text-muted tabular-nums">{formatNumber(v.view_count)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* currently watching */}
      {videos.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-success" /> Currently Watching
          </h2>
          {watchingNow.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No one is watching right now.</p>
          ) : (
            <div className="space-y-2 mb-4">
              <AnimatePresence>
                {watchingNow.map((v) => {
                  const count = liveViewers[v.id] ?? 0;
                  return (
                    <motion.div
                      layout
                      key={v.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-surface-hover/50"
                    >
                      <img src={cldPoster(v.poster_url || posterFor(videos.indexOf(v)))} alt="" className="w-16 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <Link to={`/e/${v.id}`} className="text-sm font-medium text-text-primary truncate block hover:text-accent transition-colors">
                          {v.title}
                        </Link>
                        <span className="text-xs text-text-muted">{formatNumber(v.view_count)} total views</span>
                      </div>
                      <motion.div
                        key={count}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                        </span>
                        <span className="text-xs font-semibold text-success tabular-nums">{count} live</span>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
          {notWatching.length > 0 && (
            <details className="group">
              <summary className="text-xs text-text-muted cursor-pointer hover:text-text-primary transition-colors flex items-center gap-1">
                Not currently watched ({notWatching.length})
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {notWatching.slice(0, 6).map((v) => (
                  <Link
                    key={v.id}
                    to={`/e/${v.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <img src={cldPoster(v.poster_url || posterFor(videos.indexOf(v)))} alt="" className="w-10 h-6 rounded object-cover" />
                    <span className="text-xs text-text-muted truncate flex-1">{v.title}</span>
                    <span className="text-xs text-text-dim">0</span>
                  </Link>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* activity feed */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
          <ActivityIcon className="w-4 h-4 text-accent" /> Recent activity
        </h2>
        {activities.length === 0 ? (
          <EmptyState title="No activity yet" subtitle="Upload, clone, or share to see activity here." className="py-8" />
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {activities.map((act) => {
                const cfg = ACTIVITY_ICONS[act.type] ?? ACTIVITY_ICONS.upload;
                const Icon = cfg.Icon;
                return (
                  <motion.div
                    layout
                    key={act.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-hover/50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <p className="text-sm text-text-primary flex-1">{act.message}</p>
                    <span className="text-xs text-text-dim shrink-0">{timeAgo(act.created_at)}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  );
}
