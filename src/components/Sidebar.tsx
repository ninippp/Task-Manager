import React from 'react';
import {
  CheckSquare,
  Users,
  Compass,
  FolderLock,
  ChevronRight,
  Sparkles,
  Home,
  Rocket,
  Briefcase,
  Layers,
  Heart,
  Plus,
  Flame,
} from 'lucide-react';
import { TaskList, UserProfile } from '../types';

interface SidebarProps {
  lists: TaskList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onCreateList: () => void;
  onJoinList: () => void;
  currentUser: UserProfile;
  onOpenProfile: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-4 h-4" />,
  rocket: <Rocket className="w-4 h-4" />,
  home: <Home className="w-4 h-4" />,
  briefcase: <Briefcase className="w-4 h-4" />,
  layers: <Layers className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
  'check-square': <CheckSquare className="w-4 h-4" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  lists,
  activeListId,
  onSelectList,
  onCreateList,
  onJoinList,
  currentUser,
  onOpenProfile,
  isOpenMobile,
  onCloseMobile,
}) => {
  const personalLists = lists.filter((l) => !l.isShared);
  const sharedLists = lists.filter((l) => l.isShared);

  const renderListItem = (list: TaskList) => {
    const isActive = list.id === activeListId;
    const icon = ICON_MAP[list.icon] || <CheckSquare className="w-4 h-4" />;
    const pendingTasks = (list.taskCount || 0) - (list.completedCount || 0);

    return (
      <button
        key={list.id}
        onClick={() => {
          onSelectList(list.id);
          onCloseMobile();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all text-left group relative ${
          isActive
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20 translate-x-1'
            : 'text-slate-700 hover:text-slate-900 hover:bg-white/90 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-xs transition-transform group-hover:scale-105 ${
              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
            style={!isActive ? { color: list.color } : undefined}
          >
            {icon}
          </span>
          <span className="truncate font-semibold">{list.title}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {list.isShared && (
            <span
              title={`Collaborative list (${list.collaborators.length} members)`}
              className={`text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>{list.collaborators.length}</span>
            </span>
          )}
          {pendingTasks > 0 ? (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-transform group-hover:scale-105 ${
                isActive
                  ? 'bg-amber-300 text-amber-950 shadow-2xs'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pendingTasks}
            </span>
          ) : (
            <span
              title="All clear"
              className={`text-[11px] font-bold ${isActive ? 'text-emerald-200' : 'text-emerald-600'}`}
            >
              All done
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-amber-50/50 via-rose-50/30 to-violet-50/40 backdrop-blur-md border-r border-amber-200/60 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 border-b border-amber-200/50 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base leading-tight tracking-tight">
                SynchroTask
              </h1>
              <span className="text-[11px] font-semibold bg-gradient-to-r from-rose-600 to-indigo-600 bg-clip-text text-transparent">
                Collaborative Tasks
              </span>
            </div>
          </div>

          <button
            onClick={onJoinList}
            title="Join list via invite code"
            className="p-1.5 bg-white hover:bg-amber-100/70 text-slate-700 hover:text-amber-900 border border-amber-200/80 rounded-xl transition-all shadow-2xs text-xs flex items-center gap-1 font-semibold"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Join</span>
          </button>
        </div>

        {/* Motivation Mini Card (Clean icons, no emojis) */}
        <div className="p-3 mx-3 mt-3 bg-gradient-to-r from-amber-100/80 via-orange-50/80 to-rose-100/70 border border-amber-200 rounded-2xl shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>Daily Streak</span>
                <span className="px-1.5 py-0.2 bg-amber-400/60 text-amber-900 text-[10px] rounded-full font-extrabold">3 Days</span>
              </div>
              <p className="text-[11px] text-amber-800/80 font-medium">Keep the momentum going</p>
            </div>
          </div>
        </div>

        {/* Lists Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Action to create */}
          <button
            onClick={onCreateList}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gradient-to-r hover:from-violet-50 hover:to-rose-50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs group"
          >
            <Plus className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform font-bold" />
            <span>Create New List</span>
          </button>

          {/* Shared Workspaces */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>Shared Workspaces</span>
              </div>
              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full">
                {sharedLists.length}
              </span>
            </div>
            <div className="space-y-1">
              {sharedLists.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400 italic">No shared spaces yet</p>
              ) : (
                sharedLists.map(renderListItem)
              )}
            </div>
          </div>

          {/* Personal Lists */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <FolderLock className="w-3.5 h-3.5 text-amber-500" />
                <span>Personal Focus</span>
              </div>
              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-slate-200/80 text-slate-700 rounded-full">
                {personalLists.length}
              </span>
            </div>
            <div className="space-y-1">
              {personalLists.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400 italic">No personal lists yet</p>
              ) : (
                personalLists.map(renderListItem)
              )}
            </div>
          </div>
        </div>

        {/* Current User Profile Switcher Footer */}
        <div className="p-3 border-t border-amber-200/60 bg-white/80 backdrop-blur-sm">
          <button
            onClick={onOpenProfile}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-50/70 to-rose-50/70 hover:from-amber-100/80 hover:to-rose-100/80 border border-amber-200/70 transition-all text-left group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-sm ring-2 ring-white flex-shrink-0"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.avatarInitials}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Online · Switch Persona</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </aside>
    </>
  );
};
