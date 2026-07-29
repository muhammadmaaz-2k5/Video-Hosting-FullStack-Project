import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';
import { format as formatDelivery, quality as qualityDelivery } from '@cloudinary/url-gen/actions/delivery';

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

let cld: Cloudinary | null = null;

function getCld(): Cloudinary {
  if (!cld) {
    if (!cloudName) throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not set');
    cld = new Cloudinary({ cloud: { cloudName } });
  }
  return cld;
}

/**
 * Returns a Cloudinary delivery URL for a remote image (poster/thumbnail),
 * auto-formatted and auto-cropped to the given dimensions.
 * If the source is already a Cloudinary URL, it passes through unchanged.
 */
export function cldUrl(
  src: string,
  width: number,
  height: number,
): string {
  if (!src) return '';
  // Already a Cloudinary URL — pass through
  if (src.includes('res.cloudinary.com')) return src;
  // Supabase storage URLs — use directly, Cloudinary can't proxy auth-gated storage
  if (src.includes('.supabase.co/storage/')) return src;
  // Data URIs — use directly
  if (src.startsWith('data:')) return src;
  const c = getCld();
  const img = c
    .image(src)
    .setAssetType('image')
    .delivery(formatDelivery(autoFormat()))
    .delivery(qualityDelivery(autoQuality()))
    .resize(auto().gravity(autoGravity()).width(width).height(height));
  return img.toURL();
}

export function cldPoster(src: string): string {
  return cldUrl(src, 640, 360);
}

export function cldThumb(src: string): string {
  return cldUrl(src, 400, 225);
}

export function cldAvatar(src: string): string {
  return cldUrl(src, 80, 80);
}
