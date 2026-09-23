import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronsUpDown, Clock, Cloud, CreditCard, Home, LogOut, Plus, Star, User as UserIcon, Users, X, Zap,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';
import { PlanId } from '../types';

interface SidebarProps {
  onUploadClick: () => void;
  /** Mobile drawer state. On desktop the sidebar is always visible. */
  open: boolean;
  onClose: () => void;
}

const PLAN_BADGE: Record<PlanId, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-secondary text-muted-foreground' },
  starter: { label: 'Starter', className: 'bg-accent text-accent-foreground' },
  pro: { label: 'Pro', className: 'bg-foreground text-background' },
  team: { label: 'Team', className: 'bg-success/15 text-[#1f7a5a]' },
};

const CREDIT_CAP: Record<PlanId, number> = { free: 20, starter: 500, pro: 2000, team: 1500 };

const NAV: { label: string; items: { icon: React.ElementType; label: string; to: string; end?: boolean }[] }[] = [
  {
    label: 'Workspace',
    items: [
      { icon: Home, label: 'Dashboard', to: '/app', end: true },
      { icon: Clock, label: 'Recent', to: '/app/recent' },
      { icon: Star, label: 'Starred', to: '/app/starred' },
    ],
  },
  {
    label: 'Collaborate',
    items: [
      { icon: Users, label: 'Team', to: '/app/team' },
      { icon: Cloud, label: 'Integrations', to: '/app/integrations' },
    ],
  },
  {
    label: 'Account',
    items: [{ icon: CreditCard, label: 'Plans & credits', to: '/app/plans' }],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onUploadClick, open, onClose }) => {
  const navigate = useNavigate();
  const { user, logout, team } = useAuth();

  const plan = (user?.plan ?? 'free') as PlanId;
  const credits = user?.credits ?? 0;
  const badge = PLAN_BADGE[plan];
  const pct = Math.min(100, Math.round((credits / CREDIT_CAP[plan]) * 100));
  const low = pct <= 20;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        aria-label="Sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[284px] max-w-[86vw] flex-col border-r bg-card',
          'transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'lg:static lg:z-auto lg:w-[264px] lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:visible',
          open ? 'visible translate-x-0 shadow-2xl' : 'invisible -translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Link to="/app" className="flex items-center gap-[9px] font-extrabold tracking-[-0.04em]">
            <span className="grid h-[29px] w-[29px] place-items-center rounded-[9px] bg-primary text-base text-primary-foreground">
              D
            </span>
            <span className="text-[19px]">DocuQuery</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-9 w-9 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload */}
        {team?.role !== 'viewer' && (
          <div className="px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={onUploadClick}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-primary text-sm font-bold text-primary-foreground shadow-[0_7px_18px_rgba(37,99,235,0.15)] transition-all hover:-translate-y-px hover:bg-[#1d4ed8] hover:shadow-[0_10px_24px_rgba(37,99,235,0.23)] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Upload PDF
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
          {NAV.map((group) => (
            <div key={group.label} className="mt-5 first:mt-2">
              <div className="kicker px-3 pb-2">{group.label}</div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-[9px] px-3 py-2 text-[13.5px] font-bold transition-colors',
                          isActive
                            ? 'bg-accent text-primary'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden
                            className={cn(
                              'absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Credits */}
        <div className="px-4 pb-3">
          <Link
            to="/app/plans"
            className="group block rounded-xl border bg-[#f7faff] p-3.5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <span className="kicker">Credits</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', badge.className)}>{badge.label}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-xl font-medium leading-none">{credits}</span>
              <span className="font-mono text-[11px] text-muted-foreground">/ {CREDIT_CAP[plan].toLocaleString()}</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#dbe8f9]">
              <div
                className={cn('h-full rounded-full transition-[width] duration-700', low ? 'bg-destructive' : 'bg-primary')}
                style={{ width: `${pct}%` }}
              />
            </div>
            {plan === 'free' && (
              <p className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-primary">
                <Zap className="h-3 w-3" /> Get more credits
              </p>
            )}
          </Link>
        </div>

        {/* User */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[9px] p-2 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-xs font-bold text-primary">
                    {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">{user?.name ?? 'User'}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{user?.email}</span>
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate text-sm font-bold">{user?.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/app/profile')}>
                <UserIcon className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/app/plans')}>
                <CreditCard className="mr-2 h-4 w-4" /> Plans &amp; credits
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
