import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBg?: string;
  live?: boolean;
  liveDot?: boolean;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  iconColor = 'text-accent',
  iconBg = 'bg-accent/15',
  live = false,
  liveDot = false,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-4 relative overflow-hidden"
    >
      {liveDot && (
        <span className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-[10px] font-semibold text-success uppercase tracking-wider">Live</span>
        </span>
      )}
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className={`text-2xl font-bold text-text-primary tabular-nums ${live ? 'flex items-baseline gap-1.5' : ''}`}>
        {value}
        {live && (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-success"
          />
        )}
      </div>
      <div className="text-xs text-text-muted mt-1 font-medium">{label}</div>
    </motion.div>
  );
}
