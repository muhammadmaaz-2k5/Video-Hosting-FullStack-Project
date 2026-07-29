import { supabase } from './supabase';

const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  size: number;
  fileType: string;
  filePath: string;
}

/**
 * Upload a file directly to ImageKit with byte-level progress.
 * Auth params (signature, token, expiry) are fetched from a Supabase Edge Function
 * so the private key never leaves the server.
 */
export function uploadToImageKit(
  file: File,
  folder: string,
  onProgress: (pct: number) => void,
): Promise<{ url: string | null; result: ImageKitUploadResult | null; error: string | null }> {
  // 1. Get signed auth params from Edge Function
  return supabase.auth.getSession().then(({ data: { session } }) =>
    fetch(`${supabaseUrl}/functions/v1/imagekit-auth`, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
      },
    })
  )
    .then((res) => {
      if (!res.ok) throw new Error(`Auth failed (${res.status})`);
      return res.json() as Promise<{ publicKey: string; token: string; expire: number; signature: string }>;
    })
    .then((auth) => {
      // 2. Upload file to ImageKit via XHR with progress
      return new Promise<{ url: string | null; result: ImageKitUploadResult | null; error: string | null }>((resolve) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('folder', folder);
        formData.append('publicKey', auth.publicKey);
        formData.append('token', auth.token);
        formData.append('expire', String(auth.expire));
        formData.append('signature', auth.signature);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 95));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const body: ImageKitUploadResult = JSON.parse(xhr.responseText);
            resolve({ url: body.url, result: body, error: null });
          } else {
            let msg = `Upload failed (HTTP ${xhr.status})`;
            try {
              const body = JSON.parse(xhr.responseText);
              if (body?.message) msg = body.message;
            } catch { /* ignore */ }
            resolve({ url: null, result: null, error: msg });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({ url: null, result: null, error: 'Network error — please check your connection.' });
        });

        xhr.addEventListener('abort', () => {
          resolve({ url: null, result: null, error: 'Upload cancelled.' });
        });

        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
        xhr.send(formData);
      });
    })
    .catch((e) => ({ url: null, result: null, error: `ImageKit auth error: ${e}` }));
}

/**
 * Builds an ImageKit URL for a media asset path.
 * ImageKit serves as the CDN delivery layer for processed media.
 *
 * @param path - The asset path (e.g. "videos/poster_xyz.jpg")
 * @param transformations - Optional ImageKit transformation string (e.g. "w-640,h-360")
 */
export function ikUrl(path: string, transformations?: string): string {
  if (!path) return '';
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!urlEndpoint) return path;
  const cleanPath = path.replace(/^\//, '');
  if (transformations) {
    return `${urlEndpoint}/${transformations}/${cleanPath}`;
  }
  return `${urlEndpoint}/${cleanPath}`;
}

/**
 * Returns an ImageKit-optimized poster URL (640×360).
 */
export function ikPoster(path: string): string {
  return ikUrl(path, 'tr:w-640,h-360');
}

/**
 * Returns an ImageKit-optimized thumbnail (400×225).
 */
export function ikThumb(path: string): string {
  return ikUrl(path, 'tr:w-400,h-225');
}

/**
 * Returns an ImageKit-optimized avatar (80×80, square crop).
 */
export function ikAvatar(path: string): string {
  return ikUrl(path, 'tr:w-80,h-80,fo-auto');
}
