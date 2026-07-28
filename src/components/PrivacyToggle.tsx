import { motion } from 'framer-motion';
import { Globe, Lock } from 'lucide-react';
import type { Privacy } from '@/lib/types';

interface Props {
  value: Privacy;
  onChange: (v: Privacy) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function PrivacyToggle({ value, onChange, size = 'md', disabled }: Props) {
  const isPublic = value === 'public';
  const w = size === 'sm' ? 'w-8 h-4.5' : 'w-11 h-6';
  const knob = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(isPublic ? 'private' : 'public')}
      className="inline-flex items-center gap-2 group"
      aria-label={`Privacy: ${value}`}
    >
      <span
        className={`relative ${w} rounded-full transition-colors ${
          isPublic ? 'bg-success/30' : 'bg-surface-hover'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-1/2 -translate-y-1/2 ${knob} rounded-full ${
            isPublic ? 'bg-success left-[calc(100%-0.25rem)] -translate-x-full' : 'bg-text-muted left-0.5'
          }`}
        />
      </span>
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPublic ? 'text-success' : 'text-text-muted'}`}>
        {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        {isPublic ? 'Public' : 'Private'}
      </span>
    </button>
  );
}
