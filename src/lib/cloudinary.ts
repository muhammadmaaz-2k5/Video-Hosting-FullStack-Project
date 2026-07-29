const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  thumbnail_url?: string;
}

/**
 * Upload a file directly to Cloudinary via unsigned upload preset.
 * Returns the secure_url on success.
 */
export function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress: (pct: number) => void,
): Promise<{ url: string | null; result: CloudinaryUploadResult | null; error: string | null }> {
  if (!cloudName || !uploadPreset) {
    return Promise.resolve({ url: null, result: null, error: 'Cloudinary not configured' });
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    formData.append('resource_type', 'auto');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 95));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const body: CloudinaryUploadResult = JSON.parse(xhr.responseText);
        resolve({ url: body.secure_url, result: body, error: null });
      } else {
        let msg = `Upload failed (HTTP ${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.error?.message) msg = body.error.message;
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

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

export function cldPoster(src: string): string {
  if (!src) return '';
  if (src.includes('res.cloudinary.com')) return src;
  if (src.startsWith('data:')) return src;
  if (!cloudName) return src;
  if (src.startsWith('http')) return src;
  const clean = src.split('?')[0];
  return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_640,h_360,c_fill,g_auto/${clean}`;
}

export function cldThumb(src: string): string {
  if (!src) return '';
  if (src.includes('res.cloudinary.com')) return src;
  if (src.startsWith('data:')) return src;
  if (!cloudName) return src;
  if (src.startsWith('http')) return src;
  const clean = src.split('?')[0];
  return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_400,h_225,c_fill,g_auto/${clean}`;
}

export function cldAvatar(src: string): string {
  if (!src) return '';
  if (src.includes('res.cloudinary.com')) return src;
  if (src.startsWith('data:')) return src;
  if (!cloudName) return src;
  if (src.startsWith('http')) return src;
  const clean = src.split('?')[0];
  return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_80,h_80,c_fill,g_auto/${clean}`;
}
