import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, Clock, PlayCircle } from 'lucide-react';
import type { AssetStatus } from '@/lib/types';

interface Props {
  status: AssetStatus;
  progress?: number;
  size?: 'sm' | 'md';
}

const config: Record<AssetStatus, { color: string; bg: string; label: string }> = {
  queued: { color: 'text-text-muted', bg: 'bg-surface-hover', label: 'Queued' },
  uploading: { color: 'text-info', bg: 'bg-info/10', label: 'Uploading' },
  processing: { color: 'text-warning', bg: 'bg-warning/10', label: 'Processing' },
  ready: { color: 'text-success', bg: 'bg-success/10', label: 'Ready' },
  failed: { color: 'text-danger', bg: 'bg-danger/10', label: 'Failed' },
};

export function StatusBadge({ status, size = 'sm' }: Props) {
  const c = config[status];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${c.color} ${c.bg} ${padding}`}>
      <StatusIcon status={status} />
      {c.label}
    </span>
  );
}

export function StatusIcon({ status }: { status: AssetStatus }) {
  switch (status) {
    case 'queued':
      return <Clock className="w-3.5 h-3.5 animate-pulse-dot" />;
    case 'uploading':
      return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case 'processing':
      return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case 'ready':
      return (
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="inline-flex"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </motion.span>
      );
    case 'failed':
      return (
        <motion.span
          initial={{ x: -2 }}
          animate={{ x: [0, -4, 4, -3, 3, 0] }}
          transition={{ duration: 0.4 }}
          className="inline-flex"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </motion.span>
      );
  }
}

export function StatusStateVisual({ status, progress }: Props) {
  if (status === 'ready') {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className="flex flex-col items-center gap-3 text-success"
      >
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <Check className="w-8 h-8" strokeWidth={3} />
        </div>
        <span className="text-sm font-medium text-success">Ready</span>
      </motion.div>
    );
  }

  if (status === 'failed') {
    return (
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, -6, 6, -4, 4, 0] }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3 text-danger"
      >
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <span className="text-sm font-medium text-danger">Failed</span>
      </motion.div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center gap-3 text-warning">
        <div className="w-16 h-16 rounded-full border-2 border-warning/20 border-t-warning animate-spin" />
        <span className="text-sm font-medium text-warning">Transcoding…</span>
      </div>
    );
  }

  if (status === 'uploading') {
    return (
      <div className="flex flex-col items-center gap-3 text-info w-full max-w-xs">
        <Loader2 className="w-8 h-8 animate-spin" />
        <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-info rounded-full"
            animate={{ width: `${progress ?? 0}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>
        <span className="text-sm font-medium text-info">{progress ?? 0}%</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-text-muted">
      <PlayCircle className="w-8 h-8 animate-pulse-dot" />
      <span className="text-sm font-medium text-text-muted">Queued</span>
    </div>
  );
}
