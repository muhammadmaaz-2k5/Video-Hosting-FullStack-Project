/// <reference types="vite/client" />

// lucide-react v0.344 ships without .d.ts files in its CJS build.
// This shim allows TypeScript to resolve imports without errors.
// The actual runtime types are correct — lucide-react is fully typed via ESM.
declare module 'lucide-react' {
  import type { FC, SVGProps } from 'react';
  type LucideProps = SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  };
  type LucideIcon = FC<LucideProps>;

  // Re-export every icon used in this project as a named export
  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const ArrowUpDown: LucideIcon;
  export const Bell: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Clock: LucideIcon;
  export const Copy: LucideIcon;
  export const Download: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const FileCode: LucideIcon;
  export const FileImage: LucideIcon;
  export const FileVideo: LucideIcon;
  export const Film: LucideIcon;
  export const Folder: LucideIcon;
  export const FolderClosed: LucideIcon;
  export const FolderPlus: LucideIcon;
  export const Globe: LucideIcon;
  export const HardDrive: LucideIcon;
  export const Home: LucideIcon;
  export const Image: LucideIcon;
  export const Info: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Link: LucideIcon;
  export const Loader2: LucideIcon;
  export const Lock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Pencil: LucideIcon;
  export const Play: LucideIcon;
  export const PlayCircle: LucideIcon;
  export const Radio: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCw: LucideIcon;
  export const Search: LucideIcon;
  export const Settings: LucideIcon;
  export const Share2: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Trash2: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Upload: LucideIcon;
  export const UploadCloud: LucideIcon;
  export const User: LucideIcon;
  export const Users: LucideIcon;
  export const Video: LucideIcon;
  export const X: LucideIcon;
  export const Zap: LucideIcon;
}
