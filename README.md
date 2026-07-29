# VaultStream — Video Hosting & Streaming

A full-stack video hosting platform built with React, Vite, TypeScript, Tailwind CSS, and Supabase. Users can upload, manage, stream, clone, and share videos with a modern, responsive dark-mode interface.

## Tech Stack

| Layer       | Technology                                                  |
|-------------|-------------------------------------------------------------|
| Frontend    | React 18 + Vite + TypeScript + Tailwind CSS                |
| State       | React Context (Auth, Toast, CloneTray)                      |
| Backend     | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| Database    | Supabase PostgreSQL with Row Level Security                 |
| Auth        | Supabase Auth (email/password)                              |
| Storage     | Supabase Storage (public `media` bucket)                    |
| CDN/Images  | Cloudinary (transformations) + ImageKit (CDN delivery)      |
| Streaming   | HLS via hls.js + ArtPlayer                                 |
| Realtime    | Supabase Realtime (Presence for live viewers, Postgres changes for activity) |

## Features

- User authentication (sign up, login, logout) via Supabase Auth
- Video and image upload with byte-level progress tracking via XHR
- Video transcoding and adaptive HLS streaming via Cloudinary + hls.js
- Clone videos/images from external links into your account
- Clone tray — floating progress indicator for batch clone operations
- Video and image library with search, filter, sort, and pagination
- Folder-based organization with create, rename, and privacy controls
- Video player (ArtPlayer) with HLS support, PiP, fullscreen, playback rate, screenshot, and hotkeys
- Real-time live viewer counts via Supabase Realtime Presence
- 7-day view analytics with interactive line chart
- Activity feed tracking uploads, clones, shares, privacy changes, renames, and deletes
- Download page with format, size, and codec info
- Embed page for sharing videos on external sites
- Public shared folders — anyone with the link can browse and clone
- Role-based access control (owner-only CRUD, public read for shared content)
- Privacy controls (public/private) per asset and folder
- Responsive design for desktop and mobile
- Dark theme with custom color palette and smooth animations (framer-motion)

## Project Structure

```
PROJECT 50/
├── index.html                  # HTML entry point with meta tags
├── package.json                # NPM dependencies and scripts
├── vite.config.ts              # Vite config with path alias @/
├── tsconfig.json               # TypeScript project references
├── tsconfig.app.json           # App-specific TypeScript config
├── tailwind.config.js          # Tailwind CSS theme configuration
├── postcss.config.js           # PostCSS config
├── eslint.config.js            # ESLint config
├── .gitignore                  # Git ignore rules
├── public/                     # Static assets (favicon, vite.svg)
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component with router and providers
│   ├── index.css               # Tailwind directives + custom styles
│   ├── vite-env.d.ts           # Vite client type declarations
│   ├── components/
│   │   ├── Layout.tsx          # Page layout with TopNav + Footer
│   │   ├── TopNav.tsx          # Sticky navigation bar
│   │   ├── Footer.tsx          # Site footer
│   │   ├── AssetCard.tsx       # VideoCard, ImageCard, FolderCard
│   │   ├── VideoPlayer.tsx     # ArtPlayer-based player with HLS + Realtime
│   │   ├── UploadDropzone.tsx  # Drag-and-drop file upload zone
│   │   ├── StatusBadge.tsx     # Status indicator with animated states
│   │   ├── CloneTray.tsx       # Floating clone progress tray
│   │   ├── DataTable.tsx       # Sortable, selectable, paginated table
│   │   ├── StatCard.tsx        # Dashboard stat card with live dot
│   │   ├── LineChart.tsx       # SVG line chart with hover tooltips
│   │   ├── CopyLinkButton.tsx  # Copy-to-clipboard button
│   │   ├── PrivacyToggle.tsx   # Public/private toggle switch
│   │   ├── RequireAuth.tsx     # Route guard for authenticated pages
│   │   └── EmptyState.tsx      # Reusable empty state component
│   ├── context/
│   │   ├── AuthContext.tsx     # Supabase auth session provider
│   │   ├── ToastContext.tsx    # Animated toast notification provider
│   │   └── CloneTrayContext.tsx# Clone job tracking provider
│   ├── hooks/
│   │   └── useRealtime.ts      # Supabase Realtime subscriptions
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client + publicStorageUrl helper
│   │   ├── cloudinary.ts       # Cloudinary URL generators (poster, thumb, avatar)
│   │   ├── imagekit.ts         # ImageKit URL generator + CDN helpers
│   │   ├── format.ts           # Formatting utilities (bytes, numbers, dates, stock posters)
│   │   └── types.ts            # TypeScript interfaces (Video, Image, Folder, CloneJob, etc.)
│   ├── pages/
│   │   ├── Landing.tsx         # Landing/home page
│   │   ├── Login.tsx           # Sign in / sign up with demo accounts
│   │   ├── Dashboard.tsx       # Real-time overview with stats, chart, activity
│   │   ├── Upload.tsx          # Upload videos/images with progress
│   │   ├── Clone.tsx           # Clone from external links
│   │   ├── Library.tsx         # Library with DataTable, bulk actions
│   │   ├── FolderOwner.tsx     # Folder management (owner view)
│   │   ├── FolderShared.tsx    # Public shared folder (viewer)
│   │   ├── Embed.tsx           # Embed/player page
│   │   ├── Download.tsx        # Download page with asset info
│   │   ├── Settings.tsx        # Account settings
│   │   └── NotFound.tsx        # 404 page
│   └── vite-env.d.ts           # Vite client types
├── supabase/
│   ├── functions/
│   │   └── imagekit-webhook/   # Edge Function for ImageKit processing callbacks
│   │       └── index.ts
│   └── migrations/             # SQL migrations
│       ├── 20260728194006_create_core_schema.sql
│       ├── 20260728194422_create_increment_view_rpc.sql
│       ├── 20260728194834_create_increment_clone_rpc.sql
│       ├── 20260728200051_seed_test_users.sql
│       ├── 20260728200144_seed_sample_content.sql
│       └── 20260728204217_new-migration.sql
└── README.md
```

## Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account (free tier works)
- Supabase CLI (`npm i -g supabase`)
- Cloudinary account (for image transformations) — set `VITE_CLOUDINARY_CLOUD_NAME`
- ImageKit account (for CDN delivery) — set `VITE_IMAGEKIT_URL_ENDPOINT`

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd "PROJECT 50"
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_IMAGEKIT_URL_ENDPOINT=your-imagekit-url-endpoint
```

### 3. Set up Supabase

1. Create a new Supabase project
2. Run the migrations in order:

```bash
supabase db push
```

Or apply them individually via the Supabase SQL editor.

The migrations create:
- Tables: `folders`, `videos`, `images`, `clone_jobs`, `view_events`, `activity`
- Row Level Security policies for authenticated and anonymous access
- Storage bucket `media` (public read, authenticated write)
- RPC functions: `increment_video_view_count`, `increment_clone_count`
- Test users (seeded via migration):
  - `creator@vaultstream.dev` / `creator123` — Content Creator
  - `viewer@vaultstream.dev` / `viewer123` — Casual Viewer
  - `admin@vaultstream.dev` / `admin123` — Platform Admin

### 4. Start development server

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
npm run preview
```

## Routes

| Path              | Component        | Auth Required | Description                          |
|-------------------|------------------|---------------|--------------------------------------|
| `/`               | Landing          | No            | Landing page with CTA                |
| `/login`          | Login            | No            | Sign in / sign up with demo accounts |
| `/dashboard`      | Dashboard        | Yes           | Real-time stats, chart, activity     |
| `/upload`         | Upload           | Yes           | Upload videos or images              |
| `/clone`          | Clone            | Yes           | Clone from external links            |
| `/library`        | Library          | Yes           | Browse, search, manage assets        |
| `/folder/:folderId`| FolderOwner     | Yes           | Folder management (owner)            |
| `/f/:folderId`    | FolderShared     | No            | Public shared folder view            |
| `/e/:videoId`     | Embed            | No            | Embedded video player                |
| `/d/:videoId`     | Download         | No            | Download video page                  |
| `/settings`       | Settings         | Yes           | Account settings                     |
| `*`               | NotFound         | No            | 404 page                             |

## Database Schema (Supabase)

```
folders      — id, owner_id, name, privacy, parent_id, created_at, updated_at
videos       — id, owner_id, folder_id, title, storage_path, size_bytes, content_type, poster_url, status, privacy, view_count, clone_count, cloned_from, created_at, updated_at
images       — id, owner_id, folder_id, title, storage_path, size_bytes, content_type, thumbnail_url, status, privacy, cloned_from, created_at, updated_at
clone_jobs   — id, user_id, source_type, source_ref, target_folder_id, status, progress, result_video_id, result_image_id, error_message, created_at, updated_at
view_events  — id, video_id, session_id, joined_at, left_at
activity     — id, user_id, type, message, meta, created_at
```

## State Management

The project uses React Context for state management (no external state library):

- **AuthContext** — manages user session, sign in/out, sign up
- **ToastContext** — manages toast notifications (success, error, info) with framer-motion animations
- **CloneTrayContext** — manages clone job queue with progress tracking and floating tray UI

## Real-Time Features

- **Live viewer counts** — Supabase Realtime Presence channels track active viewers per video
- **Activity feed** — Supabase Realtime Postgres changes push new activity items to the dashboard
- **Video status updates** — Realtime subscriptions update video cards when processing completes

## Media Processing

- **Upload** — XHR-based upload with byte-level progress to Supabase Storage
- **Image transformations** — Cloudinary for poster/thumb/avatar generation
- **CDN delivery** — ImageKit serves as the CDN layer for processed media
- **Webhook** — Supabase Edge Function (`imagekit-webhook`) handles ImageKit processing callbacks to mark assets as ready

## License

MIT
