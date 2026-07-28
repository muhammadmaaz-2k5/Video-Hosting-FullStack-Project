import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  AlertCircle,
  RotateCw,
  Film,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useCloneTray } from '@/context/CloneTrayContext';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const statusConfig = {
  pending: { color: 'text-text-muted', bg: 'bg-surface-hover', Icon: Loader2, spin: true, label: 'Pending' },
  fetching: { color: 'text-info', bg: 'bg-info/10', Icon: Loader2, spin: true, label: 'Fetching' },
  processing: { color: 'text-warning', bg: 'bg-warning/10', Icon: Loader2, spin: true, label: 'Processing' },
  done: { color: 'text-success', bg: 'bg-success/10', Icon: Check, spin: false, label: 'Done' },
  failed: { color: 'text-danger', bg: 'bg-danger/10', Icon: AlertCircle, spin: false, label: 'Failed' },
};

export function CloneTray() {
  const { items, open, toggle, remove, clear } = useCloneTray();
  const { success } = useToast();
  const navigate = useNavigate();
  const [allDone, setAllDone] = useState(false);

  const done = items.filter((i) => i.status === 'done').length;
  const failed = items.filter((i) => i.status === 'failed').length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  useEffect(() => {
    const finished = done + failed === total && total > 0;
    if (finished && !allDone) {
      setAllDone(true);
      const msg =
        failed > 0
          ? `${done} of ${total} cloned successfully${failed > 0 ? `, ${failed} failed` : ''}`
          : `${done} of ${total} cloned successfully`;
      success(msg);
    }
    if (total === 0) setAllDone(false);
  }, [done, failed, total, allDone, success]);

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
    >
      <div className="card shadow-2xl shadow-black/50 overflow-hidden">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
              {done + failed === total ? (
                <Check className="w-4 h-4 text-success" strokeWidth={3} />
              ) : (
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {done + failed === total ? 'Clone complete' : 'Cloning…'}
              </p>
              <p className="text-xs text-text-muted">
                {done} / {total} complete{failed > 0 ? ` · ${failed} failed` : ''}
              </p>
            </div>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronUp className="w-4 h-4 text-text-muted" />}
        </button>

        <div className="h-1 bg-surface-hover">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${pct}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>

        {open && (
          <div className="max-h-64 overflow-y-auto p-2">
            {items.map((item) => {
              const cfg = statusConfig[item.status];
              const Icon = cfg.Icon;
              return (
                <motion.div
                  layout
                  key={item.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-hover/50"
                >
                  <div className="w-8 h-8 rounded bg-surface-hover flex items-center justify-center shrink-0">
                    {item.kind === 'video' ? (
                      <Film className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{item.label}</p>
                    {item.status === 'processing' && (
                      <div className="h-1 bg-surface-hover rounded-full mt-1 overflow-hidden">
                        <motion.div
                          className="h-full bg-warning rounded-full"
                          animate={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color} shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.spin ? 'animate-spin' : ''}`} />
                    {cfg.label}
                  </span>
                  {item.status === 'failed' && item.retry && (
                    <button
                      onClick={item.retry}
                      className="p-1 rounded text-danger hover:bg-danger/10 transition-colors"
                      title="Retry"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(item.status === 'done' || item.status === 'failed') && (
                    <button
                      onClick={() => remove(item.id)}
                      className="p-1 rounded text-text-dim hover:text-text-primary transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}

            {allDone && (
              <div className="p-2 pt-3 space-y-2">
                <button
                  onClick={() => navigate('/library')}
                  className="w-full btn-primary text-sm py-2"
                >
                  View in Library
                </button>
                <button
                  onClick={clear}
                  className="w-full btn-ghost text-xs py-1.5"
                >
                  Clear tray
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
