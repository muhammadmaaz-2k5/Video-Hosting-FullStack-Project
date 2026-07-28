import { useNavigate } from 'react-router-dom';
import { Mail, LogOut, Globe, Lock, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function Settings() {
  const { user, signOut } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    success('Signed out');
    navigate('/');
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Settings</h1>
      <p className="text-sm text-text-muted mb-6">Manage your account and preferences.</p>

      <div className="max-w-2xl space-y-4">
        <div className="card p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" /> Account
          </h2>
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-black font-bold text-sm">
              {(user?.email ?? '').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{user?.email}</p>
              <p className="text-xs text-text-muted">Email address · read only</p>
            </div>
            <Mail className="w-4 h-4 text-text-dim" />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent" /> Default privacy
          </h2>
          <p className="text-sm text-text-muted mb-3">
            New uploads default to <span className="text-text-primary font-medium">Private</span> — only people with the link can view them.
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-text-muted">
              <Lock className="w-4 h-4" /> Private (recommended)
            </span>
            <span className="text-text-dim">·</span>
            <span className="inline-flex items-center gap-1.5 text-text-muted">
              <Globe className="w-4 h-4" /> Public
            </span>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Session</h2>
          <button onClick={handleSignOut} className="btn-danger">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </Layout>
  );
}
