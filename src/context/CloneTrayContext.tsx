import { createContext, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CloneTray } from '@/components/CloneTray';

export interface CloneTrayItem {
  id: string;
  label: string;
  status: 'pending' | 'fetching' | 'processing' | 'done' | 'failed';
  progress: number;
  kind: 'video' | 'image';
  retry?: () => void;
}

interface CloneTrayContextValue {
  items: CloneTrayItem[];
  open: boolean;
  start: (jobs: CloneTrayItem[]) => void;
  update: (id: string, patch: Partial<CloneTrayItem>) => void;
  remove: (id: string) => void;
  clear: () => void;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

const CloneTrayContext = createContext<CloneTrayContextValue | undefined>(undefined);

export function CloneTrayProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CloneTrayItem[]>([]);
  const [open, setOpen] = useState(false);

  const start = (jobs: CloneTrayItem[]) => {
    setItems((prev) => [...prev, ...jobs]);
    setOpen(true);
  };

  const update = (id: string, patch: Partial<CloneTrayItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const clear = () => setItems([]);

  const value: CloneTrayContextValue = {
    items,
    open,
    start,
    update,
    remove,
    clear,
    toggle: () => setOpen((o) => !o),
    expand: () => setOpen(true),
    collapse: () => setOpen(false),
  };

  return (
    <CloneTrayContext.Provider value={value}>
      {children}
      <AnimatePresence>{items.length > 0 && <CloneTray />}</AnimatePresence>
    </CloneTrayContext.Provider>
  );
}

export function useCloneTray(): CloneTrayContextValue {
  const ctx = useContext(CloneTrayContext);
  if (!ctx) throw new Error('useCloneTray must be used within CloneTrayProvider');
  return ctx;
}
