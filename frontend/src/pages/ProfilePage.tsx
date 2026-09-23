import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, KeyRound, Loader2, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert } from '../components/auth/fields';
import { PageContainer, PageHeader } from '../components/app/ui';
import { useAuth } from '../context/AuthContext';
import { errorMessage, forgotPassword } from '../services/api';

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1 border-b py-4 last:border-0 sm:flex-row sm:items-center sm:gap-6">
    <dt className="kicker sm:w-40 sm:shrink-0">{label}</dt>
    <dd className="min-w-0 break-words text-sm font-bold">{children}</dd>
  </div>
);

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const sendReset = async () => {
    if (!user) return;
    setSending(true);
    setNotice(null);
    try {
      await forgotPassword(user.email);
      setNotice({ tone: 'success', text: `We sent a password reset link to ${user.email}.` });
    } catch (e) {
      setNotice({ tone: 'error', text: errorMessage(e, 'Couldn’t send the reset link. Please try again.') });
    } finally {
      setSending(false);
    }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader kicker="Account" title="Profile" />

      <div className="animate-rise rounded-xl border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-4 border-b pb-6">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-accent text-xl font-extrabold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold tracking-[-0.04em]">{user?.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <dl>
          <Row label="Full name">{user?.name}</Row>
          <Row label="Email">{user?.email}</Row>
          <Row label="Plan">
            <span className="capitalize">{user?.plan}</span>{' '}
            <Link to="/app/plans" className="ml-2 inline-flex items-center gap-1 text-[13px] text-primary hover:underline">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </Row>
          <Row label="Credits">
            <span className="font-mono font-medium">{user?.credits ?? 0}</span>
          </Row>
          <Row label="Member since">{memberSince}</Row>
        </dl>
      </div>

      <div className="mt-4 animate-rise rounded-xl border bg-card p-5 sm:p-7" style={{ animationDelay: '80ms' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] bg-accent text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-extrabold tracking-[-0.02em]">Password</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                We’ll email you a single-use link to choose a new password.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={sendReset} disabled={sending} className="shrink-0">
            {sending ? (
              <>
                <Loader2 className="animate-spin" /> Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </div>
        {notice && (
          <Alert tone={notice.tone} className="mt-4">
            {notice.text}
          </Alert>
        )}
      </div>

      <div className="mt-6">
        <Button variant="ghost" onClick={logout} asChild>
          <Link to="/">
            <LogOut /> Sign out
          </Link>
        </Button>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
