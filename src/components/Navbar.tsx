import React from 'react';
import {
  Menu,
  Share2,
  History,
  List as ListIcon,
  Kanban,
  Grid2X2,
  Calendar,
  Lock,
  Users,
  Settings,
  WifiOff,
  UserPlus,
} from 'lucide-react';
import { TaskList, ViewMode, UserProfile } from '../types';

interface NavbarProps {
  list: TaskList | null;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onlineUsers: Array<{
    userId: string;
    name: string;
    avatarColor: string;
    avatarInitials: string;
  }>;
  typingUser: { name: string; isTyping: boolean } | null;
  onOpenShareModal: () => void;
  onOpenActivityDrawer: () => void;
  onOpenListSettings: () => void;
  onToggleMobileMenu: () => void;
  isConnected: boolean;
  currentUser: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  list,
  viewMode,
  onChangeViewMode,
  onlineUsers,
  typingUser,
  onOpenShareModal,
  onOpenActivityDrawer,
  onOpenListSettings,
  onToggleMobileMenu,
  isConnected,
  currentUser,
}) => {
  if (!list) return null;

  return (
    <header className="h-18 px-4 md:px-7 bg-white/80 backdrop-blur-md border-b border-amber-200/60 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile menu + List Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-amber-100/60 rounded-xl md:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-slate-900 text-lg md:text-xl leading-snug truncate">
              {list.title}
            </h2>
            <button
              onClick={onOpenListSettings}
              className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-indigo-50 transition-colors"
              title="List settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {list.isShared ? (
              <span className="flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                <Users className="w-3 h-3" />
                <span>Shared · {list.collaborators.length} members</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-semibold">
                <Lock className="w-3 h-3" />
                <span>Personal list</span>
              </span>
            )}

            <span aria-hidden="true" className="text-slate-300">·</span>

            {/* Real-time status indicator */}
            <span
              className="flex items-center gap-1 text-slate-500 font-medium"
              title={isConnected ? 'Real-time WebSocket synced' : 'Reconnecting to real-time service...'}
            >
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400 animate-pulse"></span>
                  <span className="hidden sm:inline text-[11px] text-emerald-700 font-bold">Live Sync</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] text-amber-600 font-medium">Reconnecting</span>
                </>
              )}
            </span>

            {typingUser && typingUser.isTyping && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-xs text-rose-600 font-bold animate-pulse truncate max-w-[140px] sm:max-w-xs">
                  {typingUser.name} is typing...
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: View Switcher Tabs */}
      <div className="hidden lg:flex items-center bg-amber-100/60 p-1 rounded-xl border border-amber-200/70 shadow-2xs">
        <button
          onClick={() => onChangeViewMode('list')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            viewMode === 'list'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ListIcon className="w-3.5 h-3.5" />
          <span>List</span>
        </button>
        <button
          onClick={() => onChangeViewMode('board')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            viewMode === 'board'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Board</span>
        </button>
        <button
          onClick={() => onChangeViewMode('matrix')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            viewMode === 'matrix'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Grid2X2 className="w-3.5 h-3.5" />
          <span>Matrix</span>
        </button>
        <button
          onClick={() => onChangeViewMode('calendar')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            viewMode === 'calendar'
              ? 'bg-white text-violet-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>
      </div>

      {/* Right: Presence Avatars + Invite Button */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Presence Avatars */}
        {list.isShared && (
          <div className="flex items-center -space-x-2 mr-1" title="Collaborators active right now">
            {onlineUsers.slice(0, 4).map((user) => {
              const isMe = user.userId === currentUser.id;
              return (
                <div
                  key={user.userId}
                  className="relative group cursor-pointer transition-transform hover:scale-110 hover:z-10"
                  title={`${user.name} ${isMe ? '(You)' : ''} · Online`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.avatarInitials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white shadow-2xs"></span>
                </div>
              );
            })}
            {onlineUsers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-black ring-2 ring-white shadow-2xs">
                +{onlineUsers.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:via-rose-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-rose-500/20"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Invite Members</span>
        </button>

        {/* Activity Feed Toggle */}
        <button
          onClick={onOpenActivityDrawer}
          className="p-2 text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200/80 rounded-xl transition-all shadow-2xs"
          title="Activity log & audit history"
        >
          <History className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
