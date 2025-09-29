import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Clock,
  Star,
  Folder,
  MessageSquare,
  Trash2,
  Settings,
  User,
  LogOut,
  Home,
  Cloud,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onUploadClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onUploadClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const mainNavItems = [
    { icon: Home, label: 'Dashboard', path: '/app' },
    { icon: Clock, label: 'Recent', path: '/app/recent' },
    { icon: Star, label: 'Starred', path: '/app/starred' },
    { icon: Folder, label: 'Folders', path: '/app/folders' },
    { icon: Cloud, label: 'Integrations', path: '/app/integrations' },
  ];

  const secondaryNavItems = [
    { icon: MessageSquare, label: 'Chat History', path: '/app/chat-history' },
    { icon: Zap, label: 'Tools', path: '/app/tools' },
    { icon: Trash2, label: 'Trash', path: '/app/trash' },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

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

      {/* Upload Button */}
      <div className="p-4">
        <Button 
          onClick={onUploadClick} 
          className="w-full gap-2" 
          size="default"
        >
          <Upload className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {/* Main Navigation */}
        <div className="space-y-1 mb-6">
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>

            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Secondary Navigation */}
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

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 text-xs"
            onClick={() => navigate('/profile')}
          >
            <User className="h-3 w-3" />
            Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 text-xs"
            onClick={handleLogout}
          >
            <LogOut className="h-3 w-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;