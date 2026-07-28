import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 bg-grid">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-7xl font-extrabold text-accent">404</h1>
        <p className="text-lg text-text-primary mt-2">Page not found</p>
        <p className="text-sm text-text-muted mt-1">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6">
          <Home className="w-4 h-4" /> Back home
        </Link>
      </motion.div>
    </div>
  );
}
