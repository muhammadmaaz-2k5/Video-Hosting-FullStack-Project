import { cldPoster, cldThumb } from './cloudinary';

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function formatNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDate(iso);
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

const PEXELS_BASE = 'https://images.pexels.com/photos';

export const STOCK_POSTERS = [
  `${PEXELS_BASE}/3129957/pexels-photo-3129957.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop`,
  `${PEXELS_BASE}/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop`,
  `${PEXELS_BASE}/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop`,
  `${PEXELS_BASE}/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop`,
  `${PEXELS_BASE}/3052361/pexels-photo-3052361.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop`,
  `${PEXELS_BASE}/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop`,
  `${PEXELS_BASE}/364026/pexels-photo-364026.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop`,
  `${PEXELS_BASE}/3573555/pexels-photo-3573555.jpeg?auto=compress&cs=tinysrgb&w=640&h=360&fit=crop`,
];

const STOCK_IMAGES = [
  `${PEXELS_BASE}/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400`,
  `${PEXELS_BASE}/1366913/pexels-photo-1366913.jpeg?auto=compress&cs=tinysrgb&w=400`,
  `${PEXELS_BASE}/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=400`,
  `${PEXELS_BASE}/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=400`,
];

export function posterFor(index: number): string {
  return cldPoster(STOCK_POSTERS[index % STOCK_POSTERS.length]);
}

export function imageThumbFor(index: number): string {
  return cldThumb(STOCK_IMAGES[index % STOCK_IMAGES.length]);
}

export const SAMPLE_VIDEO_SRC =
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';

export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
