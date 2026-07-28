# Video-Hosting-FullStack-Project

A full-stack video hosting platform built with React, Vite, Zustand, Node.js, and Supabase. Users can upload, manage, stream, and share videos with a modern, responsive interface.

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18 + Vite                   |
| State       | Zustand                           |
| Backend     | Node.js (Express)                 |
| Database    | Supabase (PostgreSQL)             |
| ORM         | Drizzle ORM (with Supabase)       |
| Auth        | Supabase Auth                     |
| Storage     | Supabase Storage                  |
| Streaming   | Supabase Remote Pipeline / HLS    |

## Features

- User authentication (sign up, login, logout) via Supabase Auth
- Video upload with progress tracking stored in Supabase Storage
- Video transcoding and adaptive streaming via Supabase Remote Pipeline
- Video library with search, filter, and pagination
- Video player with HLS support
- Watch history and likes tracking
- User profiles and video management (edit, delete)
- Responsive design for desktop and mobile
- Role-based access control (admin, user)

## Project Structure

```
project-50/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Zustand stores & API client
│   │   ├── pages/           # Route-level page components
│   │   ├── utils/           # helpers & constants
│   │   └─ main.tsx         # App entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── services/        # Business logic & Supabase clients
│   │   ├── db/              # Drizzle ORM schema & migrations
│   │   └─ index.ts         # Server entry point
│   ├── drizzle.config.ts
│   └── package.json
│
├── supabase/                 # Supabase project config & migrations
│   ├── migrations/
│   └── config.toml
│
├── .env.example
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account (free tier works)
- Supabase CLI (`npm i -g supabase`)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd PROJECT\ 50
cd client && npm install
cd ../server && npm install
```

### 2. Configure Supabase

Create a new Supabase project and note your URL and anon key. Then create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-supabase-db-connection-string
```

### 3. Run database migrations

```bash
cd server
npx drizzle-kit push
# or using supabase CLI
supabase db push
```

### 4. Start development servers

```bash
# Frontend (Vite dev server on :5173)
cd client
npm run dev

# Backend (Node.js on :3000)
cd server
npm run dev
```

### 5. Build for production

```bash
cd client && npm run build
cd server && npm run build
```

## API Endpoints

| Method   | Endpoint               | Description                     |
|----------|------------------------|---------------------------------|
| POST     | `/api/auth/signup`     | Register a new user             |
| POST     | `/api/auth/login`      | Sign in a user                  |
| POST     | `/api/auth/logout`     | Sign out the current user       |
| GET      | `/api/videos`          | List videos (paginated)         |
| POST     | `/api/videos/upload`   | Upload a new video              |
| GET      | `/api/videos/:id`      | Get video details + stream URL  |
| PUT      | `/api/videos/:id`      | Update video metadata           |
| DELETE   | `/api/videos/:id`      | Delete a video                  |
| GET      | `/api/videos/search`   | Search videos by title/tags     |
| GET      | `/api/user/profile`    | Get current user profile        |
| PUT      | `/api/user/profile`    | Update user profile             |

## State Management

Zustand stores are located in `client/src/lib/stores/`:

- `authStore` — manages user session and auth state
- `videoStore` — manages video list, upload progress, and selected video
- `uiStore` — manages UI state (sidebar, modals, toasts)

## Database Schema (Supabase + Drizzle ORM)

```
users      — id, email, avatar_url, role, created_at
videos     — id, title, description, url, thumbnail_url, user_id, duration, status, created_at
watch_history — id, user_id, video_id, watched_at
likes     — id, user_id, video_id, created_at
```

## License

MIT
