import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mail, Check, Loader2, ShieldCheck, Zap, User, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type Stage = 'email' | 'password' | 'verifying' | 'success';

export function Login() {
  const { signIn, signUp } = useAuth();
  const { error: toastError, success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard';

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [shake, setShake] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [stage]);

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErr('Enter a valid email');
      triggerShake();
      return;
    }
    setErr(null);
    setStage('password');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErr('Password must be at least 6 characters');
      triggerShake();
      return;
    }
    setErr(null);
    setStage('verifying');
    const fn = isSignUp ? signUp : signIn;
    const { error } = await fn(email, password);
    if (error) {
      setStage('password');
      setErr(error);
      triggerShake();
      toastError(error);
      return;
    }
    setStage('success');
    success(isSignUp ? 'Account created!' : 'Welcome back!');
    setTimeout(() => navigate(from, { replace: true }), 900);
  };

  const quickLogin = async (quickEmail: string, quickPass: string) => {
    setQuickLoading(quickEmail);
    setErr(null);
    const { error } = await signIn(quickEmail, quickPass);
    if (error) {
      setQuickLoading(null);
      setErr(error);
      toastError(error);
      return;
    }
    setStage('success');
    success('Welcome back!');
    setTimeout(() => navigate(from, { replace: true }), 900);
  };

  const TEST_ACCOUNTS = [
    { email: 'creator@vaultstream.dev', password: 'creator123', label: 'Content Creator', icon: Zap, desc: '6 videos, 2 folders, activity feed' },
    { email: 'viewer@vaultstream.dev', password: 'viewer123', label: 'Casual Viewer', icon: Eye, desc: '1 video, minimal library' },
    { email: 'admin@vaultstream.dev', password: 'admin123', label: 'Platform Admin', icon: User, desc: 'Fresh account, empty dashboard' },
  ];

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 py-8 bg-grid relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-info/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-black" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-text-primary tracking-tight">VaultStream</span>
        </Link>

        <motion.div
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-8"
        >
          <AnimatePresence mode="wait">
            {stage === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-text-primary">Welcome</h1>
                <p className="text-sm text-text-muted mt-1">Sign in or create an account to continue</p>

                <form onSubmit={handleEmailNext} className="mt-6 space-y-4">
                  <div>
                    <label className="label">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                      <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input pl-10"
                        autoFocus
                      />
                    </div>
                  </div>
                  {err && <p className="text-sm text-danger">{err}</p>}
                  <button type="submit" className="btn-primary w-full py-2.5">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* quick test logins */}
                <div className="mt-6 pt-5 border-t border-border-subtle">
                  <p className="text-xs text-text-dim mb-3 font-medium">Quick demo logins</p>
                  <div className="space-y-2">
                    {TEST_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => quickLogin(acc.email, acc.password)}
                        disabled={quickLoading !== null}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-hover hover:bg-surface-2 border border-border-subtle hover:border-accent/40 transition-all text-left disabled:opacity-50 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 group-hover:bg-accent/25 transition-colors">
                          {quickLoading === acc.email ? (
                            <Loader2 className="w-4 h-4 text-accent animate-spin" />
                          ) : (
                            <acc.icon className="w-4 h-4 text-accent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{acc.label}</p>
                          <p className="text-xs text-text-dim truncate">{acc.desc}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-text-dim group-hover:text-accent transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {(stage === 'password' || stage === 'verifying') && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button
                  onClick={() => {
                    setStage('email');
                    setErr(null);
                    setPassword('');
                  }}
                  className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1 mb-4"
                >
                  <ArrowLeft className="w-3 h-3" /> {email}
                </button>
                <h1 className="text-2xl font-bold text-text-primary">
                  {isSignUp ? 'Create account' : 'Enter password'}
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  {isSignUp ? 'Choose a password for your new account' : `Welcome back, ${email.split('@')[0]}`}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="label">Password</label>
                    <input
                      ref={inputRef}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input"
                      autoFocus
                      disabled={stage === 'verifying'}
                    />
                  </div>
                  {err && <p className="text-sm text-danger">{err}</p>}
                  <button type="submit" disabled={stage === 'verifying'} className="btn-primary w-full py-2.5">
                    {stage === 'verifying' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {isSignUp ? 'Create account' : 'Sign in'} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <button
                  onClick={() => {
                    setIsSignUp((v) => !v);
                    setErr(null);
                  }}
                  className="mt-4 text-xs text-text-muted hover:text-accent transition-colors w-full text-center"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </motion.div>
            )}

            {stage === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-4"
                >
                  <Check className="w-8 h-8 text-success" strokeWidth={3} />
                </motion.div>
                <h2 className="text-xl font-bold text-text-primary">Success!</h2>
                <p className="text-sm text-text-muted mt-1">Taking you to your dashboard…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-text-dim mt-6">
          <ShieldCheck className="w-3.5 h-3.5" /> Secured by VaultStream
        </p>
      </motion.div>
    </div>
  );
}
