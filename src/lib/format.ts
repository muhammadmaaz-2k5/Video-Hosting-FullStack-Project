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

const PLACEHOLDER_BASE = 'https://picsum.photos/seed';

export const STOCK_POSTERS = [
  `${PLACEHOLDER_BASE}/vault1/640/360`,
  `${PLACEHOLDER_BASE}/vault2/640/360`,
  `${PLACEHOLDER_BASE}/vault3/640/360`,
  `${PLACEHOLDER_BASE}/vault4/640/360`,
  `${PLACEHOLDER_BASE}/vault5/640/360`,
  `${PLACEHOLDER_BASE}/vault6/640/360`,
  `${PLACEHOLDER_BASE}/vault7/640/360`,
  `${PLACEHOLDER_BASE}/vault8/640/360`,
];

const STOCK_IMAGES = [
  `${PLACEHOLDER_BASE}/vault9/400/300`,
  `${PLACEHOLDER_BASE}/vault10/400/300`,
  `${PLACEHOLDER_BASE}/vault11/400/300`,
  `${PLACEHOLDER_BASE}/vault12/400/300`,
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
