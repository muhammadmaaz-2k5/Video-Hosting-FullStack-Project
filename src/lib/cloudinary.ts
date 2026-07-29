const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

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
