import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Eye, Copy as CopyIcon, Folder as FolderIcon, Image as ImageIcon, Film } from 'lucide-react';
import type { Video, Image as ImageType, Folder } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatBytes, formatNumber, posterFor, imageThumbFor } from '@/lib/format';
import { cldPoster, cldThumb } from '@/lib/cloudinary';

interface VideoCardProps {
  video: Video;
  index: number;
  showClone?: boolean;
}

export function VideoCard({ video, index, showClone }: VideoCardProps) {
  const poster = cldPoster(video.poster_url || posterFor(index));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className="card overflow-hidden group cursor-pointer"
    >
      <Link to={`/e/${video.id}`} className="block">
        <div className="relative aspect-video bg-surface-hover overflow-hidden">
          {video.status === 'ready' ? (
            <img
              src={poster}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-8 h-8 text-text-dim" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          </div>
          <div className="absolute top-2 right-2">
            <StatusBadge status={video.status} />
          </div>
        </div>
      </Link>
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary truncate">{video.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {formatNumber(video.view_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <CopyIcon className="w-3.5 h-3.5" /> {video.clone_count}
          </span>
          <span>{formatBytes(video.size_bytes)}</span>
          {showClone && video.status === 'ready' && (
            <Link
              to={`/clone?src=${video.id}`}
              className="ml-auto text-accent hover:text-accent-hover font-medium transition-colors"
            >
              Clone
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ImageCardProps {
  image: ImageType;
  index: number;
}

export function ImageCard({ image, index }: ImageCardProps) {
  const thumb = cldThumb(image.thumbnail_url || image.storage_path || imageThumbFor(index));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className="card overflow-hidden group cursor-pointer"
    >
      <div className="relative aspect-video bg-surface-hover overflow-hidden">
        {image.status === 'ready' ? (
          <img
            src={thumb}
            alt={image.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-text-dim" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={image.status} />
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary truncate">{image.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          <span>{formatBytes(image.size_bytes)}</span>
        </div>
      </div>
    </motion.div>
  );
}

interface FolderCardProps {
  folder: Folder;
  index: number;
}

export function FolderCard({ folder }: FolderCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className="card p-4 group cursor-pointer"
    >
      <Link to={`/folder/${folder.id}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center">
            <FolderIcon className="w-6 h-6 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-text-primary truncate">{folder.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {folder.privacy === 'public' ? 'Public folder' : 'Private folder'}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
