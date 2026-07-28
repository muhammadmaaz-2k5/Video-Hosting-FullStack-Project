import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Check, Copy } from 'lucide-react';

interface Props {
  url: string;
  label?: string;
  className?: string;
}

export function CopyLinkButton({ url, label = 'Copy link', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={copy}
      className={`btn-secondary text-sm ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="inline-flex items-center gap-2 text-success"
          >
            <Check className="w-4 h-4" strokeWidth={3} />
            Copied!
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="inline-flex items-center gap-2"
          >
            {label === 'Copy link' ? <LinkIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
