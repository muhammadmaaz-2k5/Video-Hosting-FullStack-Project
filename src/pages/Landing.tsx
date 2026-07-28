import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Upload, Copy, Eye, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Landing() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-base relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-info/5 rounded-full blur-3xl" />

      <header className="relative z-10 max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-black" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">VaultStream</span>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <Link to="/dashboard" className="btn-primary text-sm">Dashboard <ArrowRight className="w-4 h-4" /></Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                Sign in
              </Link>
              <Link to="/login" className="btn-primary text-sm">Get started <ArrowRight className="w-4 h-4" /></Link>
            </>
          )}
        </div>
      </header>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="chip bg-accent/10 text-accent border border-accent/20 mb-6">
            <Zap className="w-3.5 h-3.5" /> HLS streaming · instant clone · real-time analytics
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-text-primary tracking-tight text-balance">
            Host, stream & clone<br />your videos in seconds
          </h1>
          <p className="text-lg text-text-muted mt-6 max-w-2xl mx-auto text-balance">
            Upload once, stream anywhere. Clone from any link, organize into folders,
            and watch your dashboard light up with live viewer counts.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link to="/login" className="btn-primary px-6 py-3 text-base">
              {session ? 'Go to Dashboard' : 'Start free'} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">
              <Play className="w-5 h-5" /> See it live
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Upload, title: 'Upload & transcode', desc: 'Drag, drop, done. Every video auto-transcodes to adaptive HLS for buffer-free streaming.' },
            { icon: Copy, title: 'Clone from any link', desc: 'Paste a URL and clone it into your account. Bulk-clone entire folders in one click.' },
            { icon: Eye, title: 'Real-time dashboard', desc: 'See who is watching right now, with live viewer counts and a 7-day view trend.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="card p-6"
            >
              <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center mb-4">
                <f.icon className="w-5.5 h-5.5 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">{f.title}</h3>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-success" />
            <p className="text-sm text-text-muted">Private by default. Every upload is link-only until you choose to share.</p>
          </div>
          <Link to="/login" className="btn-primary text-sm shrink-0">
            Create your account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
