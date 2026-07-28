const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;

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
