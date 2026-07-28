import { useRef, useState, type ReactNode, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileVideo, FileImage, X } from 'lucide-react';
import { formatBytes } from '@/lib/format';

interface Props {
  kind: 'video' | 'image';
  onFile: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  accept: string;
  children?: ReactNode;
}

export function UploadDropzone({ kind, onFile, selectedFile, onClear, accept, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const Icon = kind === 'video' ? FileVideo : FileImage;

  return (
    <div>
      <AnimatePresence mode="wait">
        {selectedFile ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{selectedFile.name}</p>
              <p className="text-xs text-text-muted">{formatBytes(selectedFile.size)}</p>
            </div>
            <button onClick={onClear} className="btn-ghost p-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`card border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center py-12 px-6 text-center ${
              dragging ? 'border-accent bg-accent/5' : 'border-border-subtle hover:border-accent/50'
            }`}
          >
            <motion.div
              animate={dragging ? { y: -4 } : { y: 0 }}
              className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center mb-3"
            >
              <UploadCloud className="w-7 h-7 text-accent" />
            </motion.div>
            <p className="text-sm font-medium text-text-primary">
              Drag & drop your {kind} here
            </p>
            <p className="text-xs text-text-muted mt-1">or click to browse</p>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
