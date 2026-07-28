import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-black" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">VaultStream</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted">
          <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
          <Link to="/" className="hover:text-text-primary transition-colors">Terms & conditions</Link>
          <Link to="/" className="hover:text-text-primary transition-colors">Help center</Link>
          <Link to="/" className="hover:text-text-primary transition-colors">Contact Us</Link>
          <span className="text-text-dim">© {new Date().getFullYear()} VaultStream</span>
        </nav>
      </div>
    </footer>
  );
}
