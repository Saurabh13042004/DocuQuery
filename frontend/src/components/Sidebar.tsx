import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, Upload, Clock, Star, Folder, MessageSquare,
  Trash2, Settings, User, LogOut, Home, Cloud, Zap, CreditCard, Crown, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { PlanId } from '../types';

interface SidebarProps {
  onUploadClick: () => void;
}

const PLAN_BADGE: Record<PlanId, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-muted text-muted-foreground border-border' },
  starter: { label: 'Starter', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
  pro: { label: 'Pro', className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' },
  team: { label: 'Team', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const Sidebar: React.FC<SidebarProps> = ({ onUploadClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, team } = useAuth();

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path: string) => location.pathname === path;

  const mainNavItems = [
    { icon: Home, label: 'Dashboard', path: '/app' },
    { icon: Clock, label: 'Recent', path: '/app/recent' },
    { icon: Star, label: 'Starred', path: '/app/starred' },
    { icon: Folder, label: 'Folders', path: '/app/folders' },
    { icon: Users, label: 'Team', path: '/app/team' },
    { icon: Cloud, label: 'Integrations', path: '/app/integrations' },
  ];

  const secondaryNavItems = [
    { icon: MessageSquare, label: 'Chat History', path: '/app/chat-history' },
    { icon: Zap, label: 'Tools', path: '/app/tools' },
    { icon: Trash2, label: 'Trash', path: '/app/trash' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  const plan = (user?.plan ?? 'free') as PlanId;
  const credits = user?.credits ?? 0;
  const planBadge = PLAN_BADGE[plan];

  // credit bar: cap at whichever monthly limit makes sense for display
  const creditCap = plan === 'team' ? 1500 : plan === 'pro' ? 2000 : plan === 'starter' ? 500 : 20;
  const barPct = Math.min(100, Math.round((credits / creditCap) * 100));

  return (
    <div className="w-64 bg-background border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">DocuQuery</span>
        </div>
      </div>

      {/* Upload */}
      {team?.role !== 'viewer' && (
        <div className="p-4">
          <Button onClick={onUploadClick} className="w-full gap-2" size="default">
            <Upload className="h-4 w-4" />
            Upload PDF
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="space-y-1 mb-6">
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Credits widget */}
      <div className="px-4 pb-2">
        <Link
          to="/app/plans"
          className="block rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{credits} credits</span>
            </div>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${planBadge.className}`}>
              {plan === 'pro' && <Crown className="h-2.5 w-2.5 mr-0.5" />}
              {planBadge.label}
            </Badge>
          </div>

          {/* progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                barPct > 50 ? 'bg-primary' : barPct > 20 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${barPct}%` }}
            />
          </div>

          {plan === 'free' && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> Upgrade for more credits
            </p>
          )}
        </Link>
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs" onClick={() => navigate('/profile')}>
            <User className="h-3 w-3" />
            Profile
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs" onClick={handleLogout}>
            <LogOut className="h-3 w-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
