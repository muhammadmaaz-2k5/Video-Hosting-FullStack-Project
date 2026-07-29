const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

function cldFetchUrl(src: string, width: number, height: number): string {
  const clean = src.split('?')[0];
  return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_${width},h_${height},c_fill,g_auto/${clean}`;
}

export function cldPoster(src: string): string {
  if (!src) return '';
  if (src.includes('res.cloudinary.com')) return src;
  if (src.includes('.supabase.co/storage/')) return src;
  if (src.startsWith('data:')) return src;
  if (!cloudName) return src;
  return cldFetchUrl(src, 640, 360);
}

export function cldThumb(src: string): string {
  if (!src) return '';
  if (src.includes('res.cloudinary.com')) return src;
  if (src.includes('.supabase.co/storage/')) return src;
  if (src.startsWith('data:')) return src;
  if (!cloudName) return src;
  return cldFetchUrl(src, 400, 225);
}

export function cldAvatar(src: string): string {
  if (!src) return '';
  if (src.includes('res.cloudinary.com')) return src;
  if (src.includes('.supabase.co/storage/')) return src;
  if (src.startsWith('data:')) return src;
  if (!cloudName) return src;
  return cldFetchUrl(src, 80, 80);
}
