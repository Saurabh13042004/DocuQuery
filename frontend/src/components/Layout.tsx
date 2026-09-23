import React, { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import UploadModal from './UploadModal';
import { useAuth } from '../context/AuthContext';

export interface AppOutletContext {
  openUpload: () => void;
}

const Layout: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, team } = useAuth();
  const location = useLocation();
  const canUpload = team?.role !== 'viewer';

  const openUpload = useCallback(() => {
    setDrawerOpen(false);
    setShowUploadModal(true);
  }, []);

  // Close the drawer on navigation, Escape, or when the viewport becomes desktop.
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    const mq = window.matchMedia('(min-width: 1024px)');
    const onMq = () => mq.matches && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const isChat = location.pathname.startsWith('/app/chat/');

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar onUploadClick={openUpload} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card/90 px-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="grid h-10 w-10 place-items-center rounded-[9px] text-foreground transition-colors hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/app" className="flex items-center gap-2 font-extrabold tracking-[-0.04em]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">D</span>
            <span className="text-[17px]">DocuQuery</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/app/plans"
              className="rounded-full border bg-card px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {user?.credits ?? 0} cr
            </Link>
            {canUpload && (
              <button
                type="button"
                onClick={openUpload}
                aria-label="Upload PDF"
                className="grid h-9 w-9 place-items-center rounded-[9px] bg-primary text-primary-foreground shadow-[0_7px_18px_rgba(37,99,235,0.15)] transition-transform active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        <main className={isChat ? 'min-h-0 flex-1 overflow-hidden' : 'min-h-0 flex-1 overflow-y-auto'}>
          <Outlet context={{ openUpload } satisfies AppOutletContext} />
        </main>
      </div>

      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
    </div>
  );
};

export default Layout;
